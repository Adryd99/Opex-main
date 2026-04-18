package com.opex.backend.notification.dto;

import com.opex.backend.notification.model.Notification;

import java.time.OffsetDateTime;

public record NotificationResponse(
        Long id,
        String type,
        String title,
        String description,
        OffsetDateTime createdAt,
        Boolean unread,
        String icon
) {
    public static NotificationResponse from(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getType(),
                notification.getTitle(),
                notification.getDescription(),
                notification.getCreatedAt(),
                notification.getUnread(),
                notification.getIcon()
        );
    }
}
