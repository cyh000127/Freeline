package com.freeline.domain.booth.entity;

import java.time.LocalTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import com.freeline.common.entity.BaseEntity;

@Entity
@Table(name = "booths")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public class Booth extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "event_id", nullable = false)
    private Long eventId;

    @Column(name = "booth_admin_id")
    private Long boothAdminId;

    @Column(name = "name", nullable = false, length = 120)
    private String name;

    @Column(name = "location_code", length = 20)
    private String locationCode;

    @Column(name = "open_time")
    private LocalTime openTime;

    @Column(name = "close_time")
    private LocalTime closeTime;

    @Column(name = "is_closed", nullable = false)
    private boolean emergencyClosed;

    public void updateInfo(
            final String name,
            final String locationCode,
            final LocalTime openTime,
            final LocalTime closeTime
    ) {
        this.name = name;
        this.locationCode = locationCode;
        this.openTime = openTime;
        this.closeTime = closeTime;
    }

    public void updateEmergencyClosed(final boolean emergencyClosed) {
        this.emergencyClosed = emergencyClosed;
    }
}
