package com.freeline.domain.booth.entity;

import java.time.LocalDateTime;

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

@Entity
@Table(name = "booth_waiting")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public class BoothWaiting extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "booth_id", nullable = false)
    private Long boothId;

    @Column(name = "visitor_id", nullable = false)
    private Long visitorId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private WaitingStatus status;

    @Column(name = "waiting_number", nullable = false)
    private Integer waitingNumber;

    @Column(name = "defer_count", nullable = false)
    private Integer deferCount;

    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt;

    @Column(name = "called_at")
    private LocalDateTime calledAt;

    @Column(name = "call_expires_at")
    private LocalDateTime callExpiresAt;

    @Column(name = "registered_at")
    private LocalDateTime registeredAt;

    @Column(name = "entered_at")
    private LocalDateTime enteredAt;

    @Column(name = "exited_at")
    private LocalDateTime exitedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booth_id", insertable = false, updatable = false)
    private Booth booth;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "visitor_id", insertable = false, updatable = false)
    private Visitor visitor;

    public void updateStatus(final WaitingStatus status) {
        this.status = status;
    }

    public void updateWaitingNumber(final Integer waitingNumber) {
        this.waitingNumber = waitingNumber;
    }

    public void increaseDeferCount() {
        this.deferCount += 1;
    }

    public void updateCalledAt(final LocalDateTime calledAt) {
        this.calledAt = calledAt;
    }

    public void updateCallExpiresAt(final LocalDateTime callExpiresAt) {
        this.callExpiresAt = callExpiresAt;
    }

    public void updateRegisteredAt(final LocalDateTime registeredAt) {
        this.registeredAt = registeredAt;
    }

    public void updateEnteredAt(final LocalDateTime enteredAt) {
        this.enteredAt = enteredAt;
    }

    public void updateExitedAt(final LocalDateTime exitedAt) {
        this.exitedAt = exitedAt;
    }
}
