package com.freeline.domain.waiting.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

import com.freeline.common.response.BaseResponse;
import com.freeline.common.util.ResponseUtils;
import com.freeline.domain.waiting.dto.response.VisitorWaitingListResDto;
import com.freeline.domain.waiting.dto.response.WaitingCreateResDto;
import com.freeline.domain.waiting.dto.response.WaitingExpectedTimeResDto;
import com.freeline.domain.waiting.service.WaitingService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Waiting", description = "대기열 API")
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class WaitingController {

    private final WaitingService waitingService;

    @Operation(summary = "대기 등록", description = "관람객을 특정 부스 대기열에 등록합니다.")
    @PostMapping("/booths/{boothId}/waitings")
    public ResponseEntity<BaseResponse<WaitingCreateResDto>> createWaiting(
            @PathVariable final Long boothId,
            @RequestHeader("X-Visitor-Id") final Long visitorId
    ) {
        final WaitingCreateResDto response = waitingService.createWaiting(boothId, visitorId);
        return ResponseUtils.created(response);
    }

    @Operation(summary = "내 대기 목록 조회", description = "관람객의 활성 대기 목록과 현재 대기 상태를 조회합니다.")
    @GetMapping("/visitors/me/waitings")
    public ResponseEntity<BaseResponse<VisitorWaitingListResDto>> getMyWaitings(
            @RequestHeader("X-Visitor-Id") final Long visitorId
    ) {
        final VisitorWaitingListResDto response = waitingService.getMyWaitings(visitorId);
        return ResponseUtils.ok(response);
    }

    @Operation(summary = "부스 예상 대기 시간 조회", description = "특정 부스의 현재 대기 수와 예상 대기 시간을 조회합니다.")
    @GetMapping("/booths/{boothId}/waitings/expected-time")
    public ResponseEntity<BaseResponse<WaitingExpectedTimeResDto>> getExpectedWaitingTime(
            @PathVariable final Long boothId,
            @RequestHeader("X-Visitor-Id") final Long visitorId
    ) {
        final WaitingExpectedTimeResDto response = waitingService.getExpectedWaitingTime(boothId);
        return ResponseUtils.ok(response);
    }
}
