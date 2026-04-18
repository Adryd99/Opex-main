package com.opex.backend.user.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Base64;
import java.util.Locale;

import static com.opex.backend.user.service.support.UserValueSupport.firstNonBlank;

@Service
public class UserProfileImageService {

    private static final Logger log = LoggerFactory.getLogger(UserProfileImageService.class);
    private static final HttpClient PROFILE_IMAGE_HTTP_CLIENT = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    public String toStoredProfilePicture(String incomingProfilePicture) {
        String normalized = incomingProfilePicture.trim();
        if (!normalized.regionMatches(true, 0, "http://", 0, 7) && !normalized.regionMatches(true, 0, "https://", 0, 8)) {
            return normalized;
        }

        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(normalized))
                    .header("User-Agent", "Opex/1.0")
                    .GET()
                    .build();

            HttpResponse<byte[]> response = PROFILE_IMAGE_HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.warn("Unable to download remote profile picture '{}': HTTP {}", normalized, response.statusCode());
                return normalized;
            }

            String contentType = firstNonBlank(response.headers().firstValue("Content-Type").orElse(null));
            if (contentType == null || !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
                log.warn("Unable to store remote profile picture '{}': unexpected content type '{}'", normalized, contentType);
                return normalized;
            }

            String base64 = Base64.getEncoder().encodeToString(response.body());
            return "data:%s;base64,%s".formatted(contentType, base64);
        } catch (IllegalArgumentException | IOException | InterruptedException exception) {
            if (exception instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            log.warn("Unable to download remote profile picture '{}': {}", normalized, exception.getMessage());
            return normalized;
        }
    }
}
