package com.opex.backend.banking.service;

import com.opex.backend.banking.dto.BankConnectionRefreshResponse;
import com.opex.backend.banking.saltedge.SaltEdgeApiService;
import com.opex.backend.banking.saltedge.SaltEdgeBankSyncService;
import com.opex.backend.banking.saltedge.SaltEdgeConnectionLifecycleService;
import com.opex.backend.banking.saltedge.dto.SaltEdgeConnectResponse;
import com.opex.backend.banking.saltedge.dto.SaltEdgeCustomerResponse;
import com.opex.backend.common.exception.BadRequestException;
import com.opex.backend.common.exception.ExternalServiceException;
import com.opex.backend.common.exception.ResourceNotFoundException;
import com.opex.backend.legal.dto.BankIntegrationConsentRequest;
import com.opex.backend.user.model.User;
import com.opex.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BankIntegrationService {

    private final UserRepository userRepository;
    private final SaltEdgeApiService saltEdgeApiService;
    private final SaltEdgeBankSyncService saltEdgeBankSyncService;
    private final SaltEdgeConnectionLifecycleService saltEdgeConnectionLifecycleService;

    @Transactional
    public String createUserAndGetConnectUrl(String userId, BankIntegrationConsentRequest consentRequest) {
        User user = getRequiredUser(userId);
        ensureCustomerId(user);
        user.setIsActiveSaltedge(true);
        User savedUser = userRepository.save(user);
        return requestConnectUrl(savedUser, consentRequest);
    }

    @Transactional
    public String syncBankData(String userId) {
        User user = getRequiredUser(userId);
        if (user.getCustomerId() == null || user.getCustomerId().isBlank()) {
            throw new BadRequestException("Missing customerId. Call createUser first.");
        }

        saltEdgeBankSyncService.syncUserData(user);
        return user.getId();
    }

    public BankConnectionRefreshResponse refreshConnection(String userId, String connectionId) {
        String refreshUrl = saltEdgeConnectionLifecycleService.refreshConnection(userId, connectionId);
        return new BankConnectionRefreshResponse(refreshUrl);
    }

    public void removeConnection(String userId, String connectionId) {
        saltEdgeConnectionLifecycleService.removeConnection(userId, connectionId);
    }

    private User getRequiredUser(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
    }

    private void ensureCustomerId(User user) {
        if (user.getCustomerId() != null && !user.getCustomerId().isBlank()) {
            return;
        }

        SaltEdgeCustomerResponse customerResponse = saltEdgeApiService.createCustomer(
                user.getEmail() != null ? user.getEmail() : user.getId()
        );
        if (customerResponse == null
                || customerResponse.getData() == null
                || customerResponse.getData().getCustomerId() == null) {
            throw new ExternalServiceException("Unable to create Salt Edge customer.");
        }

        user.setCustomerId(customerResponse.getData().getCustomerId());
    }

    private String requestConnectUrl(User user, BankIntegrationConsentRequest consentRequest) {
        SaltEdgeConnectResponse connectResponse = saltEdgeApiService.connectConnection(
                user.getCustomerId(),
                consentRequest != null ? consentRequest.scopes() : null
        );
        if (connectResponse == null
                || connectResponse.getData() == null
                || connectResponse.getData().getConnectUrl() == null) {
            throw new ExternalServiceException("Unable to create Salt Edge connection.");
        }

        saltEdgeBankSyncService.upsertConnections(user, saltEdgeApiService.getConnections(user.getCustomerId()));
        return connectResponse.getData().getConnectUrl();
    }
}
