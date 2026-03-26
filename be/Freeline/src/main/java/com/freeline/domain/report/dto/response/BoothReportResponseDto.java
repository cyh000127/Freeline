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
public class BoothReportResponseDto {

    private ReportResponseDto.BoothPerformanceDto boothPerformance;
    private List<ReportResponseDto.HourlyTrafficDto> hourlyTraffics;
    private List<ReportResponseDto.ProblemSpotDto> problemSpots;
    private ReportResponseDto.EventSummaryDto eventSummary;
}
