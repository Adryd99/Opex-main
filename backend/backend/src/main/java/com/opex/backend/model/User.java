package com.opex.backend.model;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    private String id; // L'ID di Keycloak (es. 5f4e3b2a-...)

    private String email;
    private String firstName;
    private String lastName;

    private String customerId;
    private LocalDate dob;
    private String residence;
    private String vatFrequency;
    private Boolean gdprAccepted = false;
    private String privacyPolicyVersion;
    private OffsetDateTime privacyAcceptedAt;
    private String termsOfServiceVersion;
    private OffsetDateTime termsAcceptedAt;
    private String cookiePolicyVersion;
    private OffsetDateTime cookiePolicyAcknowledgedAt;
    private String openBankingNoticeVersion;
    private OffsetDateTime openBankingNoticeAcceptedAt;
    @Column(columnDefinition = "TEXT")
    private String openBankingConsentScopes;
    private String fiscalResidence;
    private String taxRegime;
    private String activityType;
    @Column(name = "vat_exempt")
    private Boolean vatExempt;
    @Column(name = "startup")
    private Boolean startup;
    @Column(name = "self_employed")
    private Boolean selfEmployed;
    @Column(name = "main_activity")
    private Boolean mainActivity;
    @Column(name = "public_health_insurance")
    private Boolean publicHealthInsurance;

    @Column(name = "profile_picture", columnDefinition = "TEXT")
    private String profilePicture;

    @Column(columnDefinition = "TEXT")
    private String answer1;
    @Column(columnDefinition = "TEXT")
    private String answer2;
    @Column(columnDefinition = "TEXT")
    private String answer3;
    @Column(columnDefinition = "TEXT")
    private String answer4;
    @Column(columnDefinition = "TEXT")
    private String answer5;

    private Boolean isActiveSaltedge = false;
    private Boolean isActive = true;

    public User(String id, String email, String firstName, String lastName) {
        this.id = id;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.isActive = true; // Quando si registra è ovviamente attivo
    }
}
