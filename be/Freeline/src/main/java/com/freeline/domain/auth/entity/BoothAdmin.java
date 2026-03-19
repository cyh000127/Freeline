package com.freeline.domain.auth.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

    @Column(name = "is_email_sent", nullable = false)
    @Builder.Default
    private boolean emailSent = false;

    @Column(name = "is_account_issued", nullable = false)
    @Builder.Default
    private boolean accountIssued = false;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = false;

    @Column(name = "booth_id", nullable = false)
    private Long boothId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booth_id", insertable = false, updatable = false)
    private Booth booth;

    public void changePassword(final String password) {
        this.password = password;
    }

    public void updateInfo(final String name) {
        this.name = name;
    }

    public void markEmailAsSent() {
        this.emailSent = true;
    }

    public void activateAccount() {
        this.active = true;
    }
}
