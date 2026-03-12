package com.freeline.domain.event.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import com.freeline.common.entity.BaseEntity;

@Entity
@Table(name = "event_policies")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public class EventPolicy extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false, unique = true)
    private Event event;

    @Column(name = "default_stay_sec", nullable = false)
    private Integer defaultStaySec;

    @Column(name = "default_max_waiting", nullable = false)
    private Integer defaultMaxWaiting;

    @Column(name = "default_call_count", nullable = false)
    private Integer defaultCallCount;

    @Column(name = "default_call_ttl", nullable = false)
    private Integer defaultCallTtl;

    @Column(name = "default_defer_limit", nullable = false)
    private Integer defaultDeferLimit;

    public void updatePolicy(
            final Integer defaultStaySec,
            final Integer defaultMaxWaiting,
            final Integer defaultCallCount,
            final Integer defaultCallTtl,
            final Integer defaultDeferLimit
    ) {
        this.defaultStaySec = defaultStaySec;
        this.defaultMaxWaiting = defaultMaxWaiting;
        this.defaultCallCount = defaultCallCount;
        this.defaultCallTtl = defaultCallTtl;
        this.defaultDeferLimit = defaultDeferLimit;
    }
}
