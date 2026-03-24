package com.freeline.domain.report.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

import com.freeline.common.response.BaseResponse;
import com.freeline.common.util.ResponseUtils;
import com.freeline.domain.report.dto.response.ReportResponseDto;
import com.freeline.domain.report.service.ReportQueryService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Report", description = "리포트 관리 API")
@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportQueryService reportQueryService;

    @Operation(summary = "행사 리포트 전체 조회",
            description = "종료된 행사의 요약, 부스 성과, 유입량, 동선, 문제지점 종합 데이터를 제공합니다.")
    @GetMapping("/events/{eventId}")
    public ResponseEntity<BaseResponse<ReportResponseDto>> getEventReport(
            final Authentication authentication,
            @PathVariable final Long eventId
    ) {
        final Long eventAdminId = Long.valueOf(authentication.getName());
        final ReportResponseDto response = reportQueryService.getEventReport(eventAdminId, eventId);
        return ResponseUtils.ok(response);
    }

    @Operation(summary = "부스별 성과 조회",
            description = "행사의 부스별 조회수, 등록수, 전환율, 이탈률을 제공합니다.")
    @GetMapping("/events/{eventId}/booths")
    public ResponseEntity<BaseResponse<List<ReportResponseDto.BoothPerformanceDto>>> getBoothPerformances(
            final Authentication authentication,
            @PathVariable final Long eventId
    ) {
        final Long eventAdminId = Long.valueOf(authentication.getName());
        final List<ReportResponseDto.BoothPerformanceDto> response =
                reportQueryService.getBoothPerformances(eventAdminId, eventId);
        return ResponseUtils.ok(response);
    }

    @Operation(summary = "시간대별 유입량 조회",
            description = "시간대별 활성 사용자 수 및 대기 등록 추이를 제공합니다.")
    @GetMapping("/events/{eventId}/hourly")
    public ResponseEntity<BaseResponse<List<ReportResponseDto.HourlyTrafficDto>>> getHourlyTraffics(
            final Authentication authentication,
            @PathVariable final Long eventId
    ) {
        final Long eventAdminId = Long.valueOf(authentication.getName());
        final List<ReportResponseDto.HourlyTrafficDto> response =
                reportQueryService.getHourlyTraffics(eventAdminId, eventId);
        return ResponseUtils.ok(response);
    }

    @Operation(summary = "동선 분석 조회",
            description = "방문자 이동 경로 패턴 Top N을 제공합니다.")
    @GetMapping("/events/{eventId}/paths")
    public ResponseEntity<BaseResponse<List<ReportResponseDto.VisitorPathDto>>> getVisitorPaths(
            final Authentication authentication,
            @PathVariable final Long eventId
    ) {
        final Long eventAdminId = Long.valueOf(authentication.getName());
        final List<ReportResponseDto.VisitorPathDto> response =
                reportQueryService.getVisitorPaths(eventAdminId, eventId);
        return ResponseUtils.ok(response);
    }

    @Operation(summary = "문제 지점 조회",
            description = "이탈률 이상치 부스, 대기열 포화 시간대 등 문제 지점을 제공합니다.")
    @GetMapping("/events/{eventId}/issues")
    public ResponseEntity<BaseResponse<List<ReportResponseDto.ProblemSpotDto>>> getProblemSpots(
            final Authentication authentication,
            @PathVariable final Long eventId
    ) {
        final Long eventAdminId = Long.valueOf(authentication.getName());
        final List<ReportResponseDto.ProblemSpotDto> response =
                reportQueryService.getProblemSpots(eventAdminId, eventId);
        return ResponseUtils.ok(response);
    }
}
