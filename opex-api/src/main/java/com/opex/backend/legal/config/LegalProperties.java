package com.opex.backend.legal.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

@ConfigurationProperties(prefix = "legal")
public class LegalProperties {

    private final Controller controller = new Controller();
    private final Policy policy = new Policy();
    private final Retention retention = new Retention();
    private final List<Processor> processors = new ArrayList<>();
    private final List<StorageTechnology> storageTechnologies = new ArrayList<>();

    public Controller getController() {
        return controller;
    }

    public Policy getPolicy() {
        return policy;
    }

    public Retention getRetention() {
        return retention;
    }

    public List<Processor> getProcessors() {
        return processors;
    }

    public List<StorageTechnology> getStorageTechnologies() {
        return storageTechnologies;
    }

    public static class Controller {
        private String name;
        private String address;
        private String privacyEmail;
        private String dpoEmail;
        private String supportEmail;
        private String supervisoryAuthority;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getAddress() {
            return address;
        }

        public void setAddress(String address) {
            this.address = address;
        }

        public String getPrivacyEmail() {
            return privacyEmail;
        }

        public void setPrivacyEmail(String privacyEmail) {
            this.privacyEmail = privacyEmail;
        }

        public String getDpoEmail() {
            return dpoEmail;
        }

        public void setDpoEmail(String dpoEmail) {
            this.dpoEmail = dpoEmail;
        }

        public String getSupportEmail() {
            return supportEmail;
        }

        public void setSupportEmail(String supportEmail) {
            this.supportEmail = supportEmail;
        }

        public String getSupervisoryAuthority() {
            return supervisoryAuthority;
        }

        public void setSupervisoryAuthority(String supervisoryAuthority) {
            this.supervisoryAuthority = supervisoryAuthority;
        }
    }

    public static class Policy {
        private String lastUpdated;
        private String privacyVersion;
        private String termsVersion;
        private String cookieVersion;
        private String openBankingVersion;

        public String getLastUpdated() {
            return lastUpdated;
        }

        public void setLastUpdated(String lastUpdated) {
            this.lastUpdated = lastUpdated;
        }

        public String getPrivacyVersion() {
            return privacyVersion;
        }

        public void setPrivacyVersion(String privacyVersion) {
            this.privacyVersion = privacyVersion;
        }

        public String getTermsVersion() {
            return termsVersion;
        }

        public void setTermsVersion(String termsVersion) {
            this.termsVersion = termsVersion;
        }

        public String getCookieVersion() {
            return cookieVersion;
        }

        public void setCookieVersion(String cookieVersion) {
            this.cookieVersion = cookieVersion;
        }

        public String getOpenBankingVersion() {
            return openBankingVersion;
        }

        public void setOpenBankingVersion(String openBankingVersion) {
            this.openBankingVersion = openBankingVersion;
        }
    }

    public static class Retention {
        private String activeAccount;
        private String closedAccount;
        private String openBankingData;
        private String consentAudit;

        public String getActiveAccount() {
            return activeAccount;
        }

        public void setActiveAccount(String activeAccount) {
            this.activeAccount = activeAccount;
        }

        public String getClosedAccount() {
            return closedAccount;
        }

        public void setClosedAccount(String closedAccount) {
            this.closedAccount = closedAccount;
        }

        public String getOpenBankingData() {
            return openBankingData;
        }

        public void setOpenBankingData(String openBankingData) {
            this.openBankingData = openBankingData;
        }

        public String getConsentAudit() {
            return consentAudit;
        }

        public void setConsentAudit(String consentAudit) {
            this.consentAudit = consentAudit;
        }
    }

    public static class Processor {
        private String name;
        private String purpose;
        private String dataCategories;
        private String region;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getPurpose() {
            return purpose;
        }

        public void setPurpose(String purpose) {
            this.purpose = purpose;
        }

        public String getDataCategories() {
            return dataCategories;
        }

        public void setDataCategories(String dataCategories) {
            this.dataCategories = dataCategories;
        }

        public String getRegion() {
            return region;
        }

        public void setRegion(String region) {
            this.region = region;
        }
    }

    public static class StorageTechnology {
        private String name;
        private String key;
        private String purpose;
        private String duration;
        private boolean essential;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getKey() {
            return key;
        }

        public void setKey(String key) {
            this.key = key;
        }

        public String getPurpose() {
            return purpose;
        }

        public void setPurpose(String purpose) {
            this.purpose = purpose;
        }

        public String getDuration() {
            return duration;
        }

        public void setDuration(String duration) {
            this.duration = duration;
        }

        public boolean isEssential() {
            return essential;
        }

        public void setEssential(boolean essential) {
            this.essential = essential;
        }
    }
}
