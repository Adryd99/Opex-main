package com.opex.backend.user.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class UserUpdateRequest {
    // --- Campi base (che andranno anche su Keycloak) ---
    private String email;
    private String firstName;
    private String lastName;

    // --- Campi extra (solo su DB Postgres) ---
    private String customerId;
    private LocalDate dob;
    private String residence;
    private String vatFrequency;
    private Boolean gdprAccepted;
    private String fiscalResidence;
    private String taxRegime;
    private String activityType;
    private Boolean vatExempt;
    private Boolean startup;
    private Boolean selfEmployed;
    private Boolean mainActivity;
    private Boolean publicHealthInsurance;
    private String answer1;
    private String answer2;
    private String answer3;
    private String answer4;
    private String answer5;

    private String profilePicture;

    // --- Notification Settings ---
    private Double notificationBalanceThreshold;
    private Boolean notifyCriticalBalance;
    private Boolean notifySignificantIncome;
    private Boolean notifyAbnormalOutflow;
    private Boolean notifyConsentExpiration;
    private Boolean notifySyncErrors;
    private Boolean notifyQuarterlyVat;
    private Boolean notifyMonthlyAnalysis;
}
