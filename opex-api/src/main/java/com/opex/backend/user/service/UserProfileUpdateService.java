package com.opex.backend.user.service;

import com.opex.backend.common.exception.ResourceNotFoundException;
import com.opex.backend.user.dto.UserUpdateRequest;
import com.opex.backend.user.model.User;
import com.opex.backend.user.repository.UserRepository;
import com.opex.backend.user.service.support.KeycloakUserAttributes;
import com.opex.backend.user.service.support.KeycloakUserGateway;
import com.opex.backend.user.service.support.UserAttributeNames;
import lombok.RequiredArgsConstructor;
import org.keycloak.representations.idm.UserRepresentation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.Map;
import java.util.Objects;

import static com.opex.backend.user.service.support.UserValueSupport.normalizeForComparison;
import static com.opex.backend.user.service.support.UserValueSupport.toCountryCode;
import static com.opex.backend.user.service.support.UserValueSupport.trimToNull;

@Service
@RequiredArgsConstructor
public class UserProfileUpdateService {

    private static final Logger log = LoggerFactory.getLogger(UserProfileUpdateService.class);

    private final UserRepository userRepository;
    private final KeycloakUserGateway keycloakUserGateway;
    private final UserProfileValidator userProfileValidator;

    @Transactional
    public User updateAdditionalData(String keycloakId, UserUpdateRequest request) {
        User user = userRepository.findById(keycloakId)
                .orElseThrow(() -> new ResourceNotFoundException("Utente non trovato nel DB locale"));

        userProfileValidator.validateAdultBirthDate(request.getDob());
        userProfileValidator.validateGoogleLockedFields(user, request);

        String normalizedDisplayName = trimToNull(request.getDisplayName());
        String normalizedResidence = trimToNull(request.getResidence());
        String normalizedOccupation = trimToNull(request.getOccupation());
        String normalizedPreferredLanguage = normalizePreferredLanguage(request.getPreferredLanguage());
        boolean emailChanged = request.getEmail() != null
                && !Objects.equals(normalizeForComparison(user.getEmail()), normalizeForComparison(request.getEmail()));

        boolean updateKeycloak = false;

        if (request.getEmail() != null) {
            user.setEmail(request.getEmail());
            if (emailChanged) {
                user.setEmailVerified(false);
                user.setVerificationEmailLastSentAt(null);
            }
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
        if (request.getDob() != null) {
            updateKeycloak = true;
        }
        if (request.getResidence() != null) {
            updateKeycloak = true;
        }
        if (request.getOccupation() != null) {
            updateKeycloak = true;
        }
        if (request.getDisplayName() != null) {
            user.setDisplayName(normalizedDisplayName);
        }

        userProfileValidator.validatePreferredLanguage(normalizedPreferredLanguage);
        if (updateKeycloak) {
            UserRepresentation keycloakUser = keycloakUserGateway.loadUser(keycloakId);
            Map<String, java.util.List<String>> keycloakAttributes = KeycloakUserAttributes.copyAttributes(keycloakUser);

            if (request.getEmail() != null) {
                keycloakUser.setEmail(request.getEmail());
                if (emailChanged) {
                    keycloakUser.setEmailVerified(false);
                }
            }
            if (request.getFirstName() != null) {
                keycloakUser.setFirstName(request.getFirstName());
            }
            if (request.getLastName() != null) {
                keycloakUser.setLastName(request.getLastName());
            }
            if (request.getDob() != null) {
                KeycloakUserAttributes.setSingleAttribute(keycloakAttributes, UserAttributeNames.BIRTH_DATE, request.getDob().toString());
            }
            if (request.getResidence() != null) {
                String countryCode = toCountryCode(normalizedResidence);
                if (countryCode != null) {
                    KeycloakUserAttributes.setSingleAttribute(keycloakAttributes, UserAttributeNames.COUNTRY, countryCode);
                } else {
                    keycloakAttributes.remove(UserAttributeNames.COUNTRY);
                }
            }
            if (request.getOccupation() != null) {
                if (normalizedOccupation == null) {
                    keycloakAttributes.remove(UserAttributeNames.OCCUPATION);
                } else {
                    KeycloakUserAttributes.setSingleAttribute(keycloakAttributes, UserAttributeNames.OCCUPATION, normalizedOccupation);
                }
            }

            keycloakUser.setAttributes(keycloakAttributes);
            keycloakUserGateway.updateUser(keycloakId, keycloakUser);
            log.info("Updated user '{}' in Keycloak", keycloakId);
        }

        if (request.getCustomerId() != null) user.setCustomerId(request.getCustomerId());
        if (request.getDob() != null) user.setDob(request.getDob());
        if (request.getResidence() != null) {
            user.setResidence(normalizedResidence);
            user.setCountry(toCountryCode(normalizedResidence));
            user.setFiscalResidence(normalizedResidence);
        }
        if (request.getOccupation() != null) {
            user.setOccupation(normalizedOccupation);
            user.setAnswer3(normalizedOccupation);
        }
        if (request.getPreferredLanguage() != null) user.setPreferredLanguage(normalizedPreferredLanguage);
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

    private String normalizePreferredLanguage(String preferredLanguage) {
        String normalized = trimToNull(preferredLanguage);
        return normalized == null ? null : normalized.toLowerCase(Locale.ROOT);
    }
}
