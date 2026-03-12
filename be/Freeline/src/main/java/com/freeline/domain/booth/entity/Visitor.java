package com.freeline.domain.booth.entity;

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
@Table(name = "visitors")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public class Visitor extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "event_id", nullable = false)
    private Long eventId;

    @Column(name = "entry_code", nullable = false)
    private String entryCode;

    @Column(name = "name")
    private String name;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    public void updateName(final String name) {
        this.name = name;
    }

    public void updateActive(final boolean active) {
        this.active = active;
    }
}