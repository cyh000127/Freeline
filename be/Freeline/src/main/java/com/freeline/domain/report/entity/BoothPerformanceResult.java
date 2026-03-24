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
@Table(name = "booth_performance_results")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public class BoothPerformanceResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id", nullable = false)
    private Long eventId;

    @Column(name = "booth_id", nullable = false)
    private Long boothId;

    @Column(name = "booth_name", length = 100)
    private String boothName;

    @Column(name = "view_count")
    private Long viewCount;

    @Column(name = "register_count")
    private Long registerCount;

    @Column(name = "dropout_count")
    private Long dropoutCount;

    @Column(name = "conversion_rate")
    private Double conversionRate;

    @Column(name = "dropout_rate")
    private Double dropoutRate;

    @Column(name = "analyzed_at", length = 50)
    private String analyzedAt;
}
