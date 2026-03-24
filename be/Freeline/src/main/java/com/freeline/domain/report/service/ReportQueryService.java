package com.freeline.domain.report.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

import com.freeline.common.error.ErrorCode;
import com.freeline.common.error.exception.BusinessException;
import com.freeline.domain.event.entity.Event;
import com.freeline.domain.event.repository.EventRepository;
import com.freeline.domain.report.dto.response.ReportResponseDto;
import com.freeline.domain.report.entity.BoothPerformanceResult;
import com.freeline.domain.report.entity.EventSummaryResult;
import com.freeline.domain.report.entity.HourlyTrafficResult;
import com.freeline.domain.report.entity.ProblemSpotResult;
import com.freeline.domain.report.entity.VisitorPathResult;
import com.freeline.domain.report.repository.BoothPerformanceResultRepository;
import com.freeline.domain.report.repository.EventSummaryResultRepository;
import com.freeline.domain.report.repository.HourlyTrafficResultRepository;
import com.freeline.domain.report.repository.ProblemSpotResultRepository;
import com.freeline.domain.report.repository.VisitorPathResultRepository;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportQueryService {

    private final EventRepository eventRepository;
    private final EventSummaryResultRepository eventSummaryResultRepository;
    private final BoothPerformanceResultRepository boothPerformanceResultRepository;
    private final HourlyTrafficResultRepository hourlyTrafficResultRepository;
    private final VisitorPathResultRepository visitorPathResultRepository;
    private final ProblemSpotResultRepository problemSpotResultRepository;

    public ReportResponseDto getEventReport(final Long eventAdminId, final Long eventId) {
        validateEventAccess(eventAdminId, eventId);

        final EventSummaryResult summary = eventSummaryResultRepository.findByEventId(eventId)
                .orElseThrow(() -> new BusinessException(ErrorCode.REPORT_NOT_FOUND));

        final List<BoothPerformanceResult> performances =
                boothPerformanceResultRepository.findAllByEventId(eventId);
        final List<HourlyTrafficResult> traffics =
                hourlyTrafficResultRepository.findAllByEventId(eventId);
        final List<VisitorPathResult> paths =
                visitorPathResultRepository.findAllByEventId(eventId);
        final List<ProblemSpotResult> problems =
                problemSpotResultRepository.findAllByEventId(eventId);

        return ReportResponseDto.builder()
                .summary(toSummaryDto(summary))
                .boothPerformances(toBoothPerformanceDtos(performances))
                .hourlyTraffics(toHourlyTrafficDtos(traffics))
                .visitorPaths(toVisitorPathDtos(paths))
                .problemSpots(toProblemSpotDtos(problems))
                .build();
    }

    public List<ReportResponseDto.BoothPerformanceDto> getBoothPerformances(
            final Long eventAdminId, final Long eventId) {
        validateEventAccess(eventAdminId, eventId);
        final List<BoothPerformanceResult> performances =
                boothPerformanceResultRepository.findAllByEventId(eventId);
        if (performances.isEmpty()) {
            throw new BusinessException(ErrorCode.REPORT_NOT_FOUND);
        }
        return toBoothPerformanceDtos(performances);
    }

    public List<ReportResponseDto.HourlyTrafficDto> getHourlyTraffics(
            final Long eventAdminId, final Long eventId) {
        validateEventAccess(eventAdminId, eventId);
        final List<HourlyTrafficResult> traffics =
                hourlyTrafficResultRepository.findAllByEventId(eventId);
        if (traffics.isEmpty()) {
            throw new BusinessException(ErrorCode.REPORT_NOT_FOUND);
        }
        return toHourlyTrafficDtos(traffics);
    }

    public List<ReportResponseDto.VisitorPathDto> getVisitorPaths(
            final Long eventAdminId, final Long eventId) {
        validateEventAccess(eventAdminId, eventId);
        final List<VisitorPathResult> paths =
                visitorPathResultRepository.findAllByEventId(eventId);
        if (paths.isEmpty()) {
            throw new BusinessException(ErrorCode.REPORT_NOT_FOUND);
        }
        return toVisitorPathDtos(paths);
    }

    public List<ReportResponseDto.ProblemSpotDto> getProblemSpots(
            final Long eventAdminId, final Long eventId) {
        validateEventAccess(eventAdminId, eventId);
        final List<ProblemSpotResult> problems =
                problemSpotResultRepository.findAllByEventId(eventId);
        if (problems.isEmpty()) {
            throw new BusinessException(ErrorCode.REPORT_NOT_FOUND);
        }
        return toProblemSpotDtos(problems);
    }

    private void validateEventAccess(final Long eventAdminId, final Long eventId) {
        final Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new BusinessException(ErrorCode.EVENT_NOT_FOUND));
        if (!event.getEventAdminId().equals(eventAdminId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }
    }

    private ReportResponseDto.EventSummaryDto toSummaryDto(final EventSummaryResult summary) {
        return ReportResponseDto.EventSummaryDto.builder()
                .totalVisitors(summary.getTotalVisitors())
                .totalRegistrations(summary.getTotalRegistrations())
                .avgWaitingSeconds(summary.getAvgWaitingSeconds())
                .overallDropoutRate(summary.getOverallDropoutRate())
                .peakHour(summary.getPeakHour())
                .build();
    }

    private List<ReportResponseDto.BoothPerformanceDto> toBoothPerformanceDtos(
            final List<BoothPerformanceResult> performances) {
        return performances.stream()
                .map(p -> ReportResponseDto.BoothPerformanceDto.builder()
                        .boothId(p.getBoothId())
                        .boothName(p.getBoothName())
                        .viewCount(p.getViewCount())
                        .registerCount(p.getRegisterCount())
                        .dropoutCount(p.getDropoutCount())
                        .conversionRate(p.getConversionRate())
                        .dropoutRate(p.getDropoutRate())
                        .build())
                .collect(Collectors.toList());
    }

    private List<ReportResponseDto.HourlyTrafficDto> toHourlyTrafficDtos(
            final List<HourlyTrafficResult> traffics) {
        return traffics.stream()
                .map(t -> ReportResponseDto.HourlyTrafficDto.builder()
                        .datetimeHour(t.getDatetimeHour())
                        .activeUserCount(t.getActiveUserCount())
                        .registerCount(t.getRegisterCount())
                        .build())
                .collect(Collectors.toList());
    }

    private List<ReportResponseDto.VisitorPathDto> toVisitorPathDtos(
            final List<VisitorPathResult> paths) {
        return paths.stream()
                .map(v -> ReportResponseDto.VisitorPathDto.builder()
                        .pathString(v.getPathString())
                        .visitorCount(v.getVisitorCount())
                        .build())
                .collect(Collectors.toList());
    }

    private List<ReportResponseDto.ProblemSpotDto> toProblemSpotDtos(
            final List<ProblemSpotResult> problems) {
        return problems.stream()
                .map(p -> ReportResponseDto.ProblemSpotDto.builder()
                        .issueType(p.getIssueType())
                        .targetId(p.getTargetId())
                        .targetName(p.getTargetName())
                        .severity(p.getSeverity())
                        .issueMetric(p.getIssueMetric())
                        .description(p.getDescription())
                        .build())
                .collect(Collectors.toList());
    }
}
