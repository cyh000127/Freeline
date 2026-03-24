package com.freeline.domain.report.dto.response;

import java.util.List;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public class ReportResponseDto {

    private EventSummaryDto summary;
    private List<BoothPerformanceDto> boothPerformances;
    private List<HourlyTrafficDto> hourlyTraffics;
    private List<VisitorPathDto> visitorPaths;
    private List<ProblemSpotDto> problemSpots;

    @Getter
    @Builder
    @NoArgsConstructor(access = AccessLevel.PROTECTED)
    @AllArgsConstructor(access = AccessLevel.PROTECTED)
    public static class EventSummaryDto {
        private Long totalVisitors;
        private Long totalRegistrations;
        private Double avgWaitingSeconds;
        private Double overallDropoutRate;
        private String peakHour;
    }

    @Getter
    @Builder
    @NoArgsConstructor(access = AccessLevel.PROTECTED)
    @AllArgsConstructor(access = AccessLevel.PROTECTED)
    public static class BoothPerformanceDto {
        private Long boothId;
        private String boothName;
        private Long viewCount;
        private Long registerCount;
        private Long dropoutCount;
        private Double conversionRate;
        private Double dropoutRate;
    }

    @Getter
    @Builder
    @NoArgsConstructor(access = AccessLevel.PROTECTED)
    @AllArgsConstructor(access = AccessLevel.PROTECTED)
    public static class HourlyTrafficDto {
        private String datetimeHour;
        private Long activeUserCount;
        private Long registerCount;
    }

    @Getter
    @Builder
    @NoArgsConstructor(access = AccessLevel.PROTECTED)
    @AllArgsConstructor(access = AccessLevel.PROTECTED)
    public static class VisitorPathDto {
        private String pathString;
        private Long visitorCount;
    }

    @Getter
    @Builder
    @NoArgsConstructor(access = AccessLevel.PROTECTED)
    @AllArgsConstructor(access = AccessLevel.PROTECTED)
    public static class ProblemSpotDto {
        private String issueType;
        private String targetId;
        private String targetName;
        private String severity;
        private Double issueMetric;
        private String description;
    }
}
