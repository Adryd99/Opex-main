package com.opex.backend.tax.service;

import com.opex.backend.user.model.User;

import java.math.BigDecimal;
import java.util.Locale;
import java.util.Optional;

public final class TaxUserContext {

    private static final BigDecimal VAT_FALLBACK_RATE = new BigDecimal("0.21");
    private static final BigDecimal VAT_GERMANY_RATE = new BigDecimal("0.19");
    private static final BigDecimal VAT_ITALY_RATE = new BigDecimal("0.22");
    private static final BigDecimal DUTCH_KOR_THRESHOLD = new BigDecimal("20000");
    private static final BigDecimal BELGIUM_VAT_THRESHOLD = new BigDecimal("25000");
    private static final BigDecimal GERMANY_VAT_THRESHOLD = new BigDecimal("22000");

    private final User user;
    private final String normalizedResidence;
    private final String normalizedRegime;
    private final String normalizedVatFrequency;

    public TaxUserContext(User user) {
        this.user = user != null ? user : new User();
        this.normalizedResidence = resolveNormalizedResidence(this.user);
        this.normalizedRegime = Optional.ofNullable(this.user.getTaxRegime()).orElse("").trim().toLowerCase(Locale.ROOT);
        this.normalizedVatFrequency = normalizeVatFrequency(this.user.getVatFrequency());
    }

    public User user() {
        return user;
    }

    public boolean isDutchResidence() {
        return normalizedResidence.contains("netherlands") || normalizedResidence.contains("(nl)");
    }

    public boolean isBelgianResidence() {
        return normalizedResidence.contains("belgium") || normalizedResidence.contains("(be)");
    }

    public boolean isGermanResidence() {
        return normalizedResidence.contains("germany") || normalizedResidence.contains("(de)");
    }

    public boolean isItalianResidence() {
        return normalizedResidence.contains("italy") || normalizedResidence.contains("(it)");
    }

    public boolean isVatExempt() {
        if (Boolean.TRUE.equals(user.getVatExempt())) {
            return true;
        }
        if (normalizedRegime.contains("kor")) {
            return true;
        }
        return isItalianResidence() && normalizedRegime.contains("forfett");
    }

    public boolean isForfettarioRegime() {
        return normalizedRegime.contains("forfett");
    }

    public boolean isStartup() {
        return Boolean.TRUE.equals(user.getStartup());
    }

    public boolean isSelfEmployedByDefault() {
        return !Boolean.FALSE.equals(user.getSelfEmployed());
    }

    public boolean isMainActivityByDefault() {
        return !Boolean.FALSE.equals(user.getMainActivity());
    }

    public String activityType() {
        return user.getActivityType();
    }

    public String normalizedVatFrequency() {
        return normalizedVatFrequency;
    }

    public BigDecimal resolveVatRate() {
        if (isVatExempt()) {
            return TaxMath.ZERO_RATE;
        }
        if (isGermanResidence()) {
            return VAT_GERMANY_RATE;
        }
        if (isItalianResidence()) {
            return VAT_ITALY_RATE;
        }
        return VAT_FALLBACK_RATE;
    }

    public String resolveVatRegimeLabel() {
        if (isVatExempt()) {
            return isDutchResidence() ? "KOR" : "VAT exempt";
        }
        return "Standard VAT";
    }

    public String resolveVatWarning(BigDecimal grossIncome) {
        BigDecimal safeGrossIncome = grossIncome != null ? grossIncome : BigDecimal.ZERO;

        if (isDutchResidence() && isVatExempt() && safeGrossIncome.compareTo(DUTCH_KOR_THRESHOLD) > 0) {
            return "Estimated turnover exceeds the typical Dutch KOR threshold.";
        }
        if (isBelgianResidence() && isVatExempt() && safeGrossIncome.compareTo(BELGIUM_VAT_THRESHOLD) > 0) {
            return "Estimated turnover exceeds the Belgian VAT exemption threshold.";
        }
        if (isGermanResidence() && isVatExempt() && safeGrossIncome.compareTo(GERMANY_VAT_THRESHOLD) > 0) {
            return "Estimated turnover exceeds the German Kleinunternehmer threshold.";
        }
        return null;
    }

    private String resolveNormalizedResidence(User sourceUser) {
        return Optional.ofNullable(sourceUser.getFiscalResidence())
                .filter(value -> !value.isBlank())
                .or(() -> Optional.ofNullable(sourceUser.getResidence()).filter(value -> !value.isBlank()))
                .orElse("")
                .toLowerCase(Locale.ROOT);
    }

    private String normalizeVatFrequency(String vatFrequency) {
        String normalized = Optional.ofNullable(vatFrequency).orElse("").trim().toLowerCase(Locale.ROOT);
        if (normalized.contains("month")) {
            return "monthly";
        }
        if (normalized.contains("year")) {
            return "yearly";
        }
        return "quarterly";
    }
}
