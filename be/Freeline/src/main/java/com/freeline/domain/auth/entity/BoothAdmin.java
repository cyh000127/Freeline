package com.freeline.domain.auth.entity;

import java.time.LocalDateTime;

import jakarta.annotation.Nonnull;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import com.freeline.common.entity.BaseEntity;
import com.freeline.common.util.TimeUtils;
import com.freeline.domain.booth.entity.Booth;

@Entity
@Table(name = "booth_admins")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public class BoothAdmin extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "login_id", nullable = false, length = 50)
    private String loginId;

    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "admin_name", length = 50)
    private String name;

    @Column(name = "email", nullable = false, length = 120)
    private String email;

    @Column(name = "company", length = 100)
    private String company;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private BoothAdminStatus status = BoothAdminStatus.CREATED;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "is_password_changed", nullable = false)
    @Builder.Default
    private boolean passwordChanged = false;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "booth_id", nullable = false)
    private Long boothId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booth_id", insertable = false, updatable = false)
    private Booth booth;

    public void changePassword(@Nonnull final String password) {
        this.password = password;
        this.passwordChanged = true;
        this.status = BoothAdminStatus.COMPLETED;
    }

    public void markAsMailed() {
        if (this.status == BoothAdminStatus.CREATED) {
            this.status = BoothAdminStatus.MAILED;
        }
    }

    public void recordLogin() {
        this.lastLoginAt = TimeUtils.nowDateTime();
        if (this.status == BoothAdminStatus.CREATED || this.status == BoothAdminStatus.MAILED) {
            this.status = BoothAdminStatus.LOGGED_IN;
        }
    }
}
