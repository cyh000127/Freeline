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
@Table(name = "problem_spot_results")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public class ProblemSpotResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id", nullable = false)
    private Long eventId;

    @Column(name = "issue_type", length = 50)
    private String issueType;

    @Column(name = "target_id", length = 50)
    private String targetId;

    @Column(name = "target_name", length = 100)
    private String targetName;

    @Column(name = "severity", length = 30)
    private String severity;

    @Column(name = "issue_metric")
    private Double issueMetric;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "analyzed_at", length = 50)
    private String analyzedAt;
}
