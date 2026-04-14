package com.saltedgeproxy.app.saltedgeproxy.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.Data;

import java.util.List;

@Data
public class SaltEdgeConsentRequest {

    @JsonAlias("openBankingNoticeVersion")
    private String policyVersion;
    List<String> scopes;
}
