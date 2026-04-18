package com.opex.backend.notification.controller;

import com.opex.backend.common.security.AuthenticatedUser;
import com.opex.backend.notification.dto.NotificationResponse;
import com.opex.backend.notification.model.Notification;
import com.opex.backend.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getNotifications(AuthenticatedUser authenticatedUser) {
        List<Notification> notifications = notificationService.getNotificationsForUser(authenticatedUser.userId());
        return ResponseEntity.ok(notifications.stream().map(NotificationResponse::from).toList());
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(AuthenticatedUser authenticatedUser) {
        notificationService.markAllAsRead(authenticatedUser.userId());
        return ResponseEntity.ok().build();
    }
}
