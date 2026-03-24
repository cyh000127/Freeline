package com.freeline.domain.report.entity;

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

@Entity
@Table(name = "event_summary_results")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public class EventSummaryResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id", nullable = false)
    private Long eventId;

    @Column(name = "total_visitors")
    private Long totalVisitors;

    @Column(name = "total_registrations")
    private Long totalRegistrations;

    @Column(name = "avg_waiting_seconds")
    private Double avgWaitingSeconds;

    @Column(name = "overall_dropout_rate")
    private Double overallDropoutRate;

    @Column(name = "peak_hour", length = 30)
    private String peakHour;

    @Column(name = "analyzed_at", length = 50)
    private String analyzedAt;
}
