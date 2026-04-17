package com.opex.backend.user.service;

import com.opex.backend.common.security.AuthenticatedUser;
import com.opex.backend.common.exception.ExternalServiceException;
import com.opex.backend.common.exception.ResourceNotFoundException;
import com.opex.backend.user.dto.UserUpdateRequest;
import com.opex.backend.user.model.User;
import com.opex.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.representations.idm.UserRepresentation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private static final String DEFAULT_RESIDENCE = "Netherlands (NL)";
    private static final String DEFAULT_VAT_FREQUENCY = "Quarterly";
    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;

    // Inject the Keycloak admin client configured for local and shared environments.
    private final Keycloak keycloak;

    // Resolve the target realm used by the admin client.
    @Value("${keycloak-admin.target-realm}")
    private String targetRealm;

    @Transactional
    public User syncUserWithKeycloak(AuthenticatedUser authenticatedUser) {
        String keycloakId = authenticatedUser.userId();
        Optional<User> existingUser = userRepository.findById(keycloakId);

        if (existingUser.isPresent()) {
            User user = existingUser.get();
            boolean changed = false;

            if (user.getResidence() == null || user.getResidence().isBlank()) {
                user.setResidence(DEFAULT_RESIDENCE);
                changed = true;
            }
            if (user.getVatFrequency() == null || user.getVatFrequency().isBlank()) {
                user.setVatFrequency(DEFAULT_VAT_FREQUENCY);
                changed = true;
            }
            if (user.getGdprAccepted() == null) {
                user.setGdprAccepted(false);
                changed = true;
            }

            return changed ? userRepository.save(user) : user;
        }

        String email = authenticatedUser.email();
        String firstName = authenticatedUser.firstName();
        String lastName = authenticatedUser.lastName();

        User newUser = new User(keycloakId, email, firstName, lastName);
        newUser.setResidence(DEFAULT_RESIDENCE);
        newUser.setVatFrequency(DEFAULT_VAT_FREQUENCY);
        newUser.setGdprAccepted(false);
        log.info("Synchronized new local user record for '{}'", email);

        return userRepository.save(newUser);
    }

    @Transactional
    public User updateAdditionalData(String keycloakId, UserUpdateRequest request) {
        // Load the local user first so the database remains the source of truth.
        User user = userRepository.findById(keycloakId)
                .orElseThrow(() -> new ResourceNotFoundException("Utente non trovato nel DB locale"));

        boolean updateKeycloak = false;

        // Keep shared profile fields in sync with Keycloak when they are updated locally.
        if (request.getEmail() != null) {
            user.setEmail(request.getEmail());
            updateKeycloak = true;
        }
        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
            updateKeycloak = true;
        }
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
            updateKeycloak = true;
        }

        if (updateKeycloak) {
            UserResource userResource = keycloak.realm(targetRealm).users().get(keycloakId);
            UserRepresentation keycloakUser = userResource.toRepresentation();

            if (request.getEmail() != null) keycloakUser.setEmail(request.getEmail());
            if (request.getFirstName() != null) keycloakUser.setFirstName(request.getFirstName());
            if (request.getLastName() != null) keycloakUser.setLastName(request.getLastName());

            userResource.update(keycloakUser);
            log.info("Updated user '{}' in Keycloak", keycloakId);
        }

        // Persist fields that only exist in the local domain model.
        if (request.getCustomerId() != null) user.setCustomerId(request.getCustomerId());
        if (request.getDob() != null) user.setDob(request.getDob());
        if (request.getResidence() != null) user.setResidence(request.getResidence());
        if (request.getVatFrequency() != null) user.setVatFrequency(request.getVatFrequency());
        if (request.getGdprAccepted() != null) user.setGdprAccepted(request.getGdprAccepted());
        if (request.getFiscalResidence() != null) user.setFiscalResidence(request.getFiscalResidence());
        if (request.getTaxRegime() != null) user.setTaxRegime(request.getTaxRegime());
        if (request.getActivityType() != null) user.setActivityType(request.getActivityType());
        if (request.getVatExempt() != null) user.setVatExempt(request.getVatExempt());
        if (request.getStartup() != null) user.setStartup(request.getStartup());
        if (request.getSelfEmployed() != null) user.setSelfEmployed(request.getSelfEmployed());
        if (request.getMainActivity() != null) user.setMainActivity(request.getMainActivity());
        if (request.getPublicHealthInsurance() != null) user.setPublicHealthInsurance(request.getPublicHealthInsurance());
        if (request.getAnswer1() != null) user.setAnswer1(request.getAnswer1());
        if (request.getAnswer2() != null) user.setAnswer2(request.getAnswer2());
        if (request.getAnswer3() != null) user.setAnswer3(request.getAnswer3());
        if (request.getAnswer4() != null) user.setAnswer4(request.getAnswer4());
        if (request.getAnswer5() != null) user.setAnswer5(request.getAnswer5());
        if (request.getProfilePicture() != null) user.setProfilePicture(request.getProfilePicture());

        // Notification settings
        if (request.getNotificationBalanceThreshold() != null) user.setNotificationBalanceThreshold(request.getNotificationBalanceThreshold());
        if (request.getNotifyCriticalBalance() != null) user.setNotifyCriticalBalance(request.getNotifyCriticalBalance());
        if (request.getNotifySignificantIncome() != null) user.setNotifySignificantIncome(request.getNotifySignificantIncome());
        if (request.getNotifyAbnormalOutflow() != null) user.setNotifyAbnormalOutflow(request.getNotifyAbnormalOutflow());
        if (request.getNotifyConsentExpiration() != null) user.setNotifyConsentExpiration(request.getNotifyConsentExpiration());
        if (request.getNotifySyncErrors() != null) user.setNotifySyncErrors(request.getNotifySyncErrors());
        if (request.getNotifyQuarterlyVat() != null) user.setNotifyQuarterlyVat(request.getNotifyQuarterlyVat());
        if (request.getNotifyMonthlyAnalysis() != null) user.setNotifyMonthlyAnalysis(request.getNotifyMonthlyAnalysis());

        return userRepository.save(user);
    }

    // Soft-delete locally and remove the identity from Keycloak in the same transaction.
    @Transactional
    public void deleteUser(String keycloakId) {
        User user = userRepository.findById(keycloakId)
                .orElseThrow(() -> new ResourceNotFoundException("Utente non trovato nel DB locale"));

        user.setIsActive(false);
        userRepository.save(user);

        try {
            keycloak.realm(targetRealm).users().get(keycloakId).remove();
            log.info("Deleted user '{}' from Keycloak and deactivated the local record", keycloakId);
        } catch (Exception exception) {
            throw new ExternalServiceException("Errore durante la cancellazione su Keycloak: " + exception.getMessage(), exception);
        }
    }
}
