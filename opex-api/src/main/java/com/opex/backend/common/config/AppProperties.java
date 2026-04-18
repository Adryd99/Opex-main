package com.opex.backend.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private final Cors cors = new Cors();
    private final Web web = new Web();
    private final User user = new User();

    public Cors getCors() {
        return cors;
    }

    public Web getWeb() {
        return web;
    }

    public User getUser() {
        return user;
    }

    public static class Cors {
        private List<String> allowedOriginPatterns = new ArrayList<>(List.of("http://localhost:*", "http://127.0.0.1:*"));

        public List<String> getAllowedOriginPatterns() {
            return allowedOriginPatterns;
        }

        public void setAllowedOriginPatterns(List<String> allowedOriginPatterns) {
            this.allowedOriginPatterns = allowedOriginPatterns;
        }
    }

    public static class Web {
        private String baseUrl = "http://localhost:3000";

        public String getBaseUrl() {
            return baseUrl;
        }

        public void setBaseUrl(String baseUrl) {
            this.baseUrl = baseUrl;
        }
    }

    public static class User {
        private final Defaults defaults = new Defaults();

        public Defaults getDefaults() {
            return defaults;
        }
    }

    public static class Defaults {
        private String vatFrequency = "Yearly";

        public String getVatFrequency() {
            return vatFrequency;
        }

        public void setVatFrequency(String vatFrequency) {
            this.vatFrequency = vatFrequency;
        }
    }
}
