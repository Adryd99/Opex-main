package com.opex.backend.legal.dto;

public record LegalConsentRequest(
        Boolean acceptPrivacyPolicy,
        String privacyPolicyVersion,
        Boolean acceptTermsOfService,
        String termsOfServiceVersion,
        Boolean acknowledgeCookiePolicy,
        String cookiePolicyVersion
) {
}
