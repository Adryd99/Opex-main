package com.opex.backend.service;

import com.opex.backend.model.User;
import com.opex.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private static final String DEFAULT_RESIDENCE = "Netherlands (NL)";
    private static final String DEFAULT_VAT_FREQUENCY = "Quarterly";

    private final UserRepository userRepository;

    // Inietta il client Keycloak che abbiamo configurato prima
    private final Keycloak keycloak;

    // Leggiamo il nome del realm in cui lavoriamo ("opex")
    @Value("${keycloak-admin.target-realm}")
    private String targetRealm;

    @Transactional
    public User syncUserWithKeycloak(Jwt jwt) {
        String keycloakId = jwt.getClaimAsString("sub");
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

        String email = jwt.getClaimAsString("email");
        String firstName = jwt.getClaimAsString("given_name");
        String lastName = jwt.getClaimAsString("family_name");

        User newUser = new User(keycloakId, email, firstName, lastName);
        newUser.setResidence(DEFAULT_RESIDENCE);
        newUser.setVatFrequency(DEFAULT_VAT_FREQUENCY);
        newUser.setGdprAccepted(false);
        System.out.println("Nuovo utente sincronizzato nel DB: " + email);

        return userRepository.save(newUser);
    }

    @Transactional
    public User updateAdditionalData(String keycloakId, com.opex.backend.dto.UserUpdateRequest request) {
        // 1. Recupero l'utente dal mio Database locale
        User user = userRepository.findById(keycloakId)
                .orElseThrow(() -> new RuntimeException("Utente non trovato nel DB locale"));

        boolean updateKeycloak = false;

        // 2. Controllo i campi base: Se li modifico, aggiorno anche il DB locale
        // e segno che devo fare la chiamata alle API di Keycloak
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

        // 3. SE SERVE: Faccio la chiamata a Keycloak per allineare il suo DB!
        if (updateKeycloak) {
            // Prendo l'utente specifico da Keycloak
            UserResource userResource = keycloak.realm(targetRealm).users().get(keycloakId);

            // Scarico i suoi dati attuali (Best Practice per non cancellare altri campi)
            UserRepresentation kcUser = userResource.toRepresentation();

            // Imposto i nuovi valori (se sono presenti)
            if (request.getEmail() != null) kcUser.setEmail(request.getEmail());
            if (request.getFirstName() != null) kcUser.setFirstName(request.getFirstName());
            if (request.getLastName() != null) kcUser.setLastName(request.getLastName());

            // Mando il comando di UPDATE a Keycloak!
            userResource.update(kcUser);
            System.out.println("Aggiornato utente " + keycloakId + " anche su Keycloak!");
        }

        // 4. Aggiorno i campi extra (esclusivi del DB PostgreSQL)
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
        
        // --- Notification Settings ---
        if (request.getNotificationBalanceThreshold() != null) user.setNotificationBalanceThreshold(request.getNotificationBalanceThreshold());
        if (request.getNotifyCriticalBalance() != null) user.setNotifyCriticalBalance(request.getNotifyCriticalBalance());
        if (request.getNotifySignificantIncome() != null) user.setNotifySignificantIncome(request.getNotifySignificantIncome());
        if (request.getNotifyAbnormalOutflow() != null) user.setNotifyAbnormalOutflow(request.getNotifyAbnormalOutflow());
        if (request.getNotifyConsentExpiration() != null) user.setNotifyConsentExpiration(request.getNotifyConsentExpiration());
        if (request.getNotifySyncErrors() != null) user.setNotifySyncErrors(request.getNotifySyncErrors());
        if (request.getNotifyQuarterlyVat() != null) user.setNotifyQuarterlyVat(request.getNotifyQuarterlyVat());
        if (request.getNotifyMonthlyAnalysis() != null) user.setNotifyMonthlyAnalysis(request.getNotifyMonthlyAnalysis());

        // 5. Salvo tutto sul mio Database PostgreSQL
        return userRepository.save(user);
    }

    // --- METODO PER ELIMINARE L'UTENTE (SOFT DELETE DB + HARD DELETE KEYCLOAK) ---
    @Transactional
    public void deleteUser(String keycloakId) {
        // 1. Cerco l'utente nel mio DB locale
        User user = userRepository.findById(keycloakId)
                .orElseThrow(() -> new RuntimeException("Utente non trovato nel DB locale"));

        // 2. SOFT DELETE: Non lo cancello fisicamente, ma lo disattivo
        user.setIsActive(false);
        userRepository.save(user); // Salvo la modifica nel DB locale

        // 3. HARD DELETE SU KEYCLOAK: Lo elimino definitivamente dall'Identity Provider
        try {
            keycloak.realm(targetRealm).users().get(keycloakId).remove();
            System.out.println("Utente " + keycloakId + " eliminato da Keycloak e disattivato nel DB locale.");
        } catch (Exception e) {
            // Se per qualche motivo Keycloak fallisce (es. utente già rimosso a mano),
            // lanciamo un'eccezione così Spring fa il "Rollback" e rimette isActive=true nel DB!
            throw new RuntimeException("Errore durante la cancellazione su Keycloak: " + e.getMessage());
        }
    }
}
