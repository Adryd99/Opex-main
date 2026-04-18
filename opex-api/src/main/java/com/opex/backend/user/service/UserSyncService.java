package com.opex.backend.user.service;

import com.opex.backend.common.config.AppProperties;
import com.opex.backend.common.security.AuthenticatedUser;
import com.opex.backend.user.model.User;
import com.opex.backend.user.repository.UserRepository;
import com.opex.backend.user.service.support.KeycloakProfileSnapshot;
import com.opex.backend.user.service.support.KeycloakUserGateway;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import java.util.function.BiConsumer;
import java.util.function.Function;

import static com.opex.backend.user.service.support.UserValueSupport.firstNonBlank;
import static com.opex.backend.user.service.support.UserValueSupport.firstNonNull;
import static com.opex.backend.user.service.support.UserValueSupport.joinNames;
import static com.opex.backend.user.service.support.UserValueSupport.toResidenceDisplay;

@Service
@RequiredArgsConstructor
public class UserSyncService {

    private static final Logger log = LoggerFactory.getLogger(UserSyncService.class);

    private final UserRepository userRepository;
    private final KeycloakUserGateway keycloakUserGateway;
    private final UserProfileImageService userProfileImageService;
    private final AppProperties appProperties;

    @Transactional
    public User syncUserWithKeycloak(AuthenticatedUser authenticatedUser) {
        String keycloakId = authenticatedUser.userId();
        Optional<User> existingUser = userRepository.findById(keycloakId);
        KeycloakProfileSnapshot snapshot = keycloakUserGateway.loadProfileSnapshot(authenticatedUser);
        User user = existingUser.orElseGet(() -> new User(
                keycloakId,
                snapshot.email(),
                snapshot.firstName(),
                snapshot.lastName()
        ));
        boolean changed = existingUser.isEmpty();

        changed |= applyPrimaryIdentity(user, snapshot);
        changed |= applyOnboardingAttributes(user, snapshot);
        changed |= applyIdentityProviderSnapshot(user, snapshot);
        changed |= applyProfilePictureSnapshot(user, snapshot);
        changed |= applySecondFactorSnapshot(user, snapshot);
        changed |= applyLegalSnapshot(user, snapshot);
        changed |= applyDefaults(user);

        if (existingUser.isEmpty()) {
            log.info("Synchronized new local user record for '{}'", snapshot.email());
            return userRepository.save(user);
        }

        if (changed) {
            log.info("Refreshed local user record for '{}' from Keycloak", keycloakId);
            return userRepository.save(user);
        }

        return user;
    }

    private boolean applyPrimaryIdentity(User user, KeycloakProfileSnapshot snapshot) {
        boolean changed = false;

        changed |= updateValue(user, User::getEmail, User::setEmail, firstNonBlank(snapshot.email(), user.getEmail()));
        changed |= updateValue(user, User::getEmailVerified, User::setEmailVerified, firstNonNull(snapshot.emailVerified(), user.getEmailVerified(), false));
        changed |= updateValue(user, User::getRegistrationDate, User::setRegistrationDate, firstNonNull(snapshot.registrationDate(), user.getRegistrationDate()));
        changed |= updateValue(user, User::getFirstName, User::setFirstName, firstNonBlank(snapshot.firstName(), user.getFirstName()));
        changed |= updateValue(user, User::getLastName, User::setLastName, firstNonBlank(snapshot.lastName(), user.getLastName()));
        changed |= updateValue(user, User::getDob, User::setDob, firstNonNull(snapshot.birthDate(), user.getDob()));

        return changed;
    }

    private boolean applyOnboardingAttributes(User user, KeycloakProfileSnapshot snapshot) {
        boolean changed = false;
        String country = snapshot.country();
        String residence = toResidenceDisplay(country);
        String occupation = snapshot.occupation();
        String fullName = joinNames(
                firstNonBlank(snapshot.firstName(), user.getFirstName()),
                firstNonBlank(snapshot.lastName(), user.getLastName())
        );

        changed |= updateValue(user, User::getCountry, User::setCountry, country);
        changed |= updateValue(user, User::getResidence, User::setResidence, residence);
        changed |= updateValue(user, User::getOccupation, User::setOccupation, occupation);
        changed |= updateValue(user, User::getAnswer1, User::setAnswer1, firstNonBlank(fullName, user.getAnswer1()));
        changed |= updateValue(user, User::getAnswer2, User::setAnswer2, residence);
        changed |= updateValue(user, User::getAnswer3, User::setAnswer3, occupation);

        if (residence == null) {
            changed |= updateValue(user, User::getFiscalResidence, User::setFiscalResidence, null);
        } else if (user.getFiscalResidence() == null || user.getFiscalResidence().isBlank()) {
            changed |= updateValue(user, User::getFiscalResidence, User::setFiscalResidence, residence);
        }

        return changed;
    }

    private boolean applyIdentityProviderSnapshot(User user, KeycloakProfileSnapshot snapshot) {
        return updateValue(user, User::getIdentityProvider, User::setIdentityProvider, snapshot.identityProvider());
    }

    private boolean applyProfilePictureSnapshot(User user, KeycloakProfileSnapshot snapshot) {
        String incomingProfilePicture = firstNonBlank(snapshot.profilePicture());
        if (incomingProfilePicture == null) {
            return false;
        }

        String currentProfilePicture = user.getProfilePicture();
        if (currentProfilePicture != null && currentProfilePicture.trim().toLowerCase(Locale.ROOT).startsWith("data:image/")) {
            return false;
        }

        String storedProfilePicture = userProfileImageService.toStoredProfilePicture(incomingProfilePicture);
        return updateValue(user, User::getProfilePicture, User::setProfilePicture, storedProfilePicture);
    }

    private boolean applySecondFactorSnapshot(User user, KeycloakProfileSnapshot snapshot) {
        boolean changed = false;

        changed |= updateValue(user, User::getPreferredSecondFactor, User::setPreferredSecondFactor, firstNonBlank(snapshot.preferredSecondFactor(), user.getPreferredSecondFactor()));
        changed |= updateValue(
                user,
                User::getSecondFactorEnrollmentDeferred,
                User::setSecondFactorEnrollmentDeferred,
                firstNonNull(snapshot.secondFactorEnrollmentDeferred(), user.getSecondFactorEnrollmentDeferred(), false)
        );
        changed |= updateValue(user, User::getSecondFactorMethod, User::setSecondFactorMethod, firstNonBlank(snapshot.secondFactorMethod(), user.getSecondFactorMethod()));
        changed |= updateValue(
                user,
                User::getSecondFactorConfiguredAt,
                User::setSecondFactorConfiguredAt,
                firstNonNull(snapshot.secondFactorConfiguredAt(), user.getSecondFactorConfiguredAt())
        );

        return changed;
    }

    private boolean applyLegalSnapshot(User user, KeycloakProfileSnapshot snapshot) {
        boolean changed = false;

        changed |= updateValue(user, User::getGdprAccepted, User::setGdprAccepted, firstNonNull(snapshot.legalAccepted(), user.getGdprAccepted(), false));
        changed |= updateValue(user, User::getLegalVersion, User::setLegalVersion, firstNonBlank(snapshot.legalVersion(), user.getLegalVersion()));
        changed |= updateValue(user, User::getPrivacyPolicyVersion, User::setPrivacyPolicyVersion, firstNonBlank(snapshot.privacyPolicyVersion(), user.getPrivacyPolicyVersion()));
        changed |= updateValue(user, User::getPrivacyAcceptedAt, User::setPrivacyAcceptedAt, firstNonNull(snapshot.privacyAcceptedAt(), user.getPrivacyAcceptedAt()));
        changed |= updateValue(user, User::getTermsOfServiceVersion, User::setTermsOfServiceVersion, firstNonBlank(snapshot.termsOfServiceVersion(), user.getTermsOfServiceVersion()));
        changed |= updateValue(user, User::getTermsAcceptedAt, User::setTermsAcceptedAt, firstNonNull(snapshot.termsAcceptedAt(), user.getTermsAcceptedAt()));
        changed |= updateValue(user, User::getCookiePolicyVersion, User::setCookiePolicyVersion, firstNonBlank(snapshot.cookiePolicyVersion(), user.getCookiePolicyVersion()));
        changed |= updateValue(
                user,
                User::getCookiePolicyAcknowledgedAt,
                User::setCookiePolicyAcknowledgedAt,
                firstNonNull(snapshot.cookiePolicyAcknowledgedAt(), user.getCookiePolicyAcknowledgedAt())
        );
        changed |= updateValue(
                user,
                User::getStrictlyNecessaryCookiesAcknowledged,
                User::setStrictlyNecessaryCookiesAcknowledged,
                firstNonNull(snapshot.strictlyNecessaryCookiesAcknowledged(), user.getStrictlyNecessaryCookiesAcknowledged(), false)
        );

        return changed;
    }

    private boolean applyDefaults(User user) {
        boolean changed = false;

        changed |= updateValue(
                user,
                User::getDisplayName,
                User::setDisplayName,
                firstNonBlank(user.getDisplayName(), joinNames(user.getFirstName(), user.getLastName()), user.getEmail(), "Opex User")
        );
        changed |= updateValue(
                user,
                User::getVatFrequency,
                User::setVatFrequency,
                firstNonBlank(user.getVatFrequency(), appProperties.getUser().getDefaults().getVatFrequency())
        );
        changed |= updateValue(user, User::getSecondFactorEnrollmentDeferred, User::setSecondFactorEnrollmentDeferred, firstNonNull(user.getSecondFactorEnrollmentDeferred(), false));
        changed |= updateValue(user, User::getGdprAccepted, User::setGdprAccepted, firstNonNull(user.getGdprAccepted(), false));
        changed |= updateValue(
                user,
                User::getStrictlyNecessaryCookiesAcknowledged,
                User::setStrictlyNecessaryCookiesAcknowledged,
                firstNonNull(user.getStrictlyNecessaryCookiesAcknowledged(), false)
        );

        return changed;
    }

    private <T> boolean updateValue(User user, Function<User, T> getter, BiConsumer<User, T> setter, T newValue) {
        if (Objects.equals(getter.apply(user), newValue)) {
            return false;
        }

        setter.accept(user, newValue);
        return true;
    }
}
