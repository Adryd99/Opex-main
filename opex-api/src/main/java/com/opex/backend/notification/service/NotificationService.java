package com.opex.backend.notification.service;

import com.opex.backend.notification.model.Notification;
import com.opex.backend.notification.repository.NotificationRepository;
import com.opex.backend.user.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public List<Notification> getNotificationsForUser(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            notification.setUnread(false);
            notificationRepository.save(notification);
        });
    }

    @Transactional
    public void markAllAsRead(String userId) {
        List<Notification> unread = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .filter(Notification::getUnread)
                .toList();
        unread.forEach(n -> n.setUnread(false));
        notificationRepository.saveAll(unread);
    }

    @Transactional
    public Notification createNotification(User user, String type, String title, String description, String icon) {
        Notification notification = new Notification(user, type, title, description, icon);
        return notificationRepository.save(notification);
    }
}
