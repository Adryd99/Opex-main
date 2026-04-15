package com.opex.backend.dto.legal;

public record LegalConsentRequest(
        Boolean acceptPrivacyPolicy,
        String privacyPolicyVersion,
        Boolean acceptTermsOfService,
        String termsOfServiceVersion,
        Boolean acknowledgeCookiePolicy,
        String cookiePolicyVersion
) {
}
