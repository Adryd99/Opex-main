package com.opex.backend.common.keycloak;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "keycloak.verify-email")
public class KeycloakVerifyEmailProperties {

    private Integer lifespanSeconds = 43200;

    public Integer getLifespanSeconds() {
        return lifespanSeconds;
    }

    public void setLifespanSeconds(Integer lifespanSeconds) {
        this.lifespanSeconds = lifespanSeconds;
    }
}
