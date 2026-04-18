package com.opex.backend.user.service;

import com.opex.backend.common.exception.ExternalServiceException;
import com.opex.backend.common.exception.ResourceNotFoundException;
import com.opex.backend.user.model.User;
import com.opex.backend.user.repository.UserRepository;
import com.opex.backend.user.service.support.KeycloakUserGateway;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserLifecycleService {

    private static final Logger log = LoggerFactory.getLogger(UserLifecycleService.class);

    private final UserRepository userRepository;
    private final KeycloakUserGateway keycloakUserGateway;

    @Transactional
    public void deleteUser(String keycloakId) {
        User user = userRepository.findById(keycloakId)
                .orElseThrow(() -> new ResourceNotFoundException("Utente non trovato nel DB locale"));

        user.setIsActive(false);
        userRepository.save(user);

        try {
            keycloakUserGateway.deleteUser(keycloakId);
            log.info("Deleted user '{}' from Keycloak and deactivated the local record", keycloakId);
        } catch (Exception exception) {
            throw new ExternalServiceException("Errore durante la cancellazione su Keycloak: " + exception.getMessage(), exception);
        }
    }
}
