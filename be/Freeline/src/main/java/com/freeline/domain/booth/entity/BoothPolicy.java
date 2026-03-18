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
@Table(name = "booth_policies")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public class BoothPolicy extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "booth_id", nullable = false)
    private Long boothId;

    @Column(name = "stay_time")
    private Integer stayTime;

    @Column(name = "max_waiting_count")
    private Integer maxWaitingCount;

    @Column(name = "call_count")
    private Integer callCount;

    @Column(name = "call_valid_time")
    private Integer callValidTime;

    @Column(name = "defer_limit")
    private Integer deferLimit;

    public void updatePolicy(
            final Integer stayTime,
            final Integer maxWaitingCount,
            final Integer callCount,
            final Integer callValidTime,
            final Integer deferLimit
    ) {
        this.stayTime = stayTime;
        this.maxWaitingCount = maxWaitingCount;
        this.callCount = callCount;
        this.callValidTime = callValidTime;
        this.deferLimit = deferLimit;
    }
}
