package com.opex.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String type; // success, warning, info, danger
    private String title;
    private String description;
    private OffsetDateTime createdAt;
    private Boolean unread = true;
    private String icon; // Icon identifier (e.g. lucide-react name)

    public Notification(User user, String type, String title, String description, String icon) {
        this.user = user;
        this.type = type;
        this.title = title;
        this.description = description;
        this.icon = icon;
        this.createdAt = OffsetDateTime.now();
        this.unread = true;
    }
}
