package com.opex.backend.user.service.support;

import org.keycloak.representations.idm.UserRepresentation;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public final class KeycloakUserAttributes {

    private KeycloakUserAttributes() {
    }

    public static Map<String, List<String>> copyAttributes(UserRepresentation userRepresentation) {
        return new HashMap<>(Optional.ofNullable(userRepresentation.getAttributes()).orElseGet(HashMap::new));
    }

    public static void setSingleAttribute(Map<String, List<String>> attributes, String key, String value) {
        if (value == null || value.isBlank()) {
            attributes.remove(key);
            return;
        }

        attributes.put(key, List.of(value));
    }

    public static String getAttribute(Map<String, List<String>> attributes, String key) {
        List<String> values = attributes.get(key);
        if (values == null || values.isEmpty()) {
            return null;
        }

        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }

        return null;
    }
}
