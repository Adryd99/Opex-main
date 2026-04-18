package com.opex.backend.banking.saltedge;

import com.opex.backend.common.exception.ExternalServiceException;
import com.opex.backend.banking.saltedge.dto.SaltEdgeAccountResponse;
import com.opex.backend.banking.saltedge.dto.SaltEdgeConnectionsResponse;
import com.opex.backend.banking.saltedge.dto.SaltEdgeConnectResponse;
import com.opex.backend.banking.saltedge.dto.SaltEdgeCustomerResponse;
import com.opex.backend.banking.saltedge.dto.SaltEdgeTransactionResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
@lombok.RequiredArgsConstructor
public class SaltEdgeApiService {

    private static final Logger log = LoggerFactory.getLogger(SaltEdgeApiService.class);
    private static final String BASE_URL = "https://www.saltedge.com/api/v6";
    private static final List<String> DEFAULT_CONSENT_SCOPES = List.of("accounts", "transactions");

    private final SaltEdgeProperties saltEdgeProperties;

    private final RestTemplate restTemplate = new RestTemplate();

    public SaltEdgeCustomerResponse createCustomer(String email) {
        Map<String, Object> customerData = new HashMap<>();
        customerData.put("email", email);

        Map<String, Object> body = new HashMap<>();
        body.put("data", customerData);

        return postForObject("/customers", body, SaltEdgeCustomerResponse.class, "Unable to create Salt Edge customer.");
    }

    public SaltEdgeConnectResponse connectConnection(String customerId, List<String> scopes) {
        Map<String, Object> consent = new HashMap<>();
        consent.put("scopes", normalizeConsentScopes(scopes));

        Map<String, Object> attempt = new HashMap<>();
        attempt.put("return_to", saltEdgeProperties.getReturnToUrl());

        Map<String, Object> data = new HashMap<>();
        data.put("customer_id", customerId);
        data.put("consent", consent);
        data.put("attempt", attempt);

        Map<String, Object> body = new HashMap<>();
        body.put("data", data);

        return postForObject("/connections/connect", body, SaltEdgeConnectResponse.class, "Unable to create Salt Edge connection.");
    }

    public SaltEdgeConnectResponse refreshConnection(String connectionId) {
        Map<String, Object> attempt = new HashMap<>();
        attempt.put("fetch_scopes", normalizeConsentScopes(null));
        attempt.put("return_to", saltEdgeProperties.getReturnToUrl());

        Map<String, Object> data = new HashMap<>();
        data.put("return_connection_id", true);
        data.put("return_error_class", false);
        data.put("automatic_refresh", true);
        data.put("show_widget", false);
        data.put("attempt", attempt);

        Map<String, Object> body = new HashMap<>();
        body.put("data", data);

        return postForObject(
                "/connections/" + connectionId + "/refresh",
                body,
                SaltEdgeConnectResponse.class,
                "Unable to refresh Salt Edge connection."
        );
    }

    public SaltEdgeAccountResponse getAccounts(String connectionId) {
        String url = BASE_URL + "/accounts?connection_id=" + connectionId;
        return exchange(url, HttpMethod.GET, null, SaltEdgeAccountResponse.class, "Unable to fetch Salt Edge accounts.");
    }

    public SaltEdgeConnectionsResponse getConnections(String customerId) {
        String url = BASE_URL + "/connections?customer_id=" + customerId;
        return exchange(url, HttpMethod.GET, null, SaltEdgeConnectionsResponse.class, "Unable to fetch Salt Edge connections.");
    }

    public SaltEdgeTransactionResponse getTransactions(String connectionId, String accountId) {
        String url = BASE_URL + "/transactions?connection_id=" + connectionId + "&account_id=" + accountId;
        return exchange(url, HttpMethod.GET, null, SaltEdgeTransactionResponse.class, "Unable to fetch Salt Edge transactions.");
    }

    public void removeConnection(String connectionId) {
        String url = BASE_URL + "/connections/" + connectionId;
        try {
            exchange(url, HttpMethod.DELETE, null, Void.class, "Unable to remove Salt Edge connection.");
        } catch (HttpClientErrorException.NotFound exception) {
            log.info("Salt Edge connection '{}' already missing remotely", connectionId);
        }
    }

    private <T> T postForObject(String path, Object body, Class<T> responseType, String failureMessage) {
        return exchange(BASE_URL + path, HttpMethod.POST, body, responseType, failureMessage);
    }

    private <T> T exchange(String url,
                           HttpMethod method,
                           Object body,
                           Class<T> responseType,
                           String failureMessage) {
        HttpEntity<?> entity = body != null ? new HttpEntity<>(body, buildHeaders()) : new HttpEntity<>(buildHeaders());

        try {
            ResponseEntity<T> response = restTemplate.exchange(url, method, entity, responseType);
            return response.getBody();
        } catch (HttpClientErrorException.NotFound exception) {
            throw exception;
        } catch (RestClientException exception) {
            throw new ExternalServiceException(failureMessage, exception);
        }
    }

    private HttpHeaders buildHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("App-id", saltEdgeProperties.getAppId());
        headers.set("Secret", saltEdgeProperties.getSecret());
        return headers;
    }

    List<String> normalizeConsentScopes(List<String> scopes) {
        if (scopes == null || scopes.isEmpty()) {
            return DEFAULT_CONSENT_SCOPES;
        }

        Set<String> normalizedScopes = new LinkedHashSet<>();
        for (String scope : scopes) {
            String normalizedScope = normalizeConsentScope(scope);
            if (normalizedScope != null) {
                normalizedScopes.add(normalizedScope);
            }
        }

        if (normalizedScopes.isEmpty()) {
            return DEFAULT_CONSENT_SCOPES;
        }

        return new ArrayList<>(normalizedScopes);
    }

    private String normalizeConsentScope(String scope) {
        if (scope == null || scope.isBlank()) {
            return null;
        }

        return switch (scope.trim().toLowerCase(Locale.ROOT)) {
            case "accounts", "account", "account_details", "balances" -> "accounts";
            case "holder_info", "holder-info", "holderinfo" -> "holder_info";
            case "transactions", "transaction" -> "transactions";
            default -> null;
        };
    }
}
