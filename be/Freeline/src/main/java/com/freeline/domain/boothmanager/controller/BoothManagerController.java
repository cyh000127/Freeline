package com.freeline.domain.boothmanager.controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import lombok.RequiredArgsConstructor;

import com.freeline.common.response.BaseResponse;
import com.freeline.common.util.ResponseUtils;
import com.freeline.domain.boothmanager.dto.response.BoothManagerDashboardResDto;
import com.freeline.domain.boothmanager.service.BoothManagerService;
import com.freeline.domain.boothmanager.service.BoothManagerSseService;
import com.freeline.domain.waiting.dto.response.WaitingAdmitResDto;
import com.freeline.domain.waiting.dto.response.WaitingCallResDto;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "BoothManager", description = "부스 관리자 대시보드 API")
@RestController
@RequestMapping("/api/v1/booth-managers")
@RequiredArgsConstructor
public class BoothManagerController {

    private final BoothManagerService boothManagerService;
    private final BoothManagerSseService boothManagerSseService;

    @Operation(summary = "부스 관리자 대시보드 조회", description = "앞큐와 현재 이용중인 고객 목록을 분리해 조회합니다.")
    @GetMapping("/booths/{boothId}/dashboard")
    public ResponseEntity<BaseResponse<BoothManagerDashboardResDto>> getDashboard(
            @PathVariable final Long boothId
    ) {
        final BoothManagerDashboardResDto response = boothManagerService.getDashboard(boothId);
        return ResponseUtils.ok(response);
    }

    @Operation(summary = "부스 관리자 SSE 구독", description = "부스 관리자 화면이 실시간 대기열 변경 이벤트를 구독합니다.")
    @GetMapping(value = "/booths/{boothId}/subscribe", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(
            @PathVariable final Long boothId
    ) {
        return boothManagerSseService.subscribe(boothId);
    }

    @Operation(summary = "다음 대기자 호출", description = "호출 가능한 다음 사용자를 앞큐로 호출합니다.")
    @PostMapping("/booths/{boothId}/waitings/call-next")
    public ResponseEntity<BaseResponse<WaitingCallResDto>> callNextWaiting(
            @PathVariable final Long boothId
    ) {
        final WaitingCallResDto response = boothManagerService.callNextWaiting(boothId);
        return ResponseUtils.ok(response);
    }

    @Operation(summary = "입장 처리", description = "도착 확인이 완료된 사용자를 입장 처리합니다.")
    @PatchMapping("/booths/{boothId}/waitings/{waitingId}/admit")
    public ResponseEntity<BaseResponse<WaitingAdmitResDto>> admitWaiting(
            @PathVariable final Long boothId,
            @PathVariable final Long waitingId
    ) {
        final WaitingAdmitResDto response = boothManagerService.admitWaiting(boothId, waitingId);
        return ResponseUtils.ok(response);
    }

    @Operation(summary = "관리자 대기 취소", description = "부스 관리자가 특정 대기를 취소 처리합니다.")
    @DeleteMapping("/booths/{boothId}/waitings/{waitingId}")
    public ResponseEntity<BaseResponse<Void>> cancelWaiting(
            @PathVariable final Long boothId,
            @PathVariable final Long waitingId
    ) {
        boothManagerService.cancelWaiting(boothId, waitingId);
        return ResponseUtils.ok(null);
    }
}
