package com.freeline.domain.waiting.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

import com.freeline.common.response.BaseResponse;
import com.freeline.common.util.ResponseUtils;
import com.freeline.domain.waiting.dto.response.VisitorWaitingListResDto;
import com.freeline.domain.waiting.dto.response.WaitingAdmitResDto;
import com.freeline.domain.waiting.dto.response.WaitingCallResDto;
import com.freeline.domain.waiting.dto.response.WaitingCreateResDto;
import com.freeline.domain.waiting.dto.response.WaitingExitResDto;
import com.freeline.domain.waiting.dto.response.WaitingExpectedTimeResDto;
import com.freeline.domain.waiting.dto.response.WaitingPostponeResDto;
import com.freeline.domain.waiting.service.WaitingService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Waiting", description = "대기열 API")
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class WaitingController {

    private final WaitingService waitingService;

    @Operation(summary = "대기 등록", description = "관람객이 특정 부스의 대기열에 등록합니다.")
    @PostMapping("/booths/{boothId}/waitings")
    public ResponseEntity<BaseResponse<WaitingCreateResDto>> createWaiting(
            @PathVariable final Long boothId,
            @RequestHeader("X-Visitor-Id") final Long visitorId
    ) {
        final WaitingCreateResDto response = waitingService.createWaiting(boothId, visitorId);
        return ResponseUtils.created(response);
    }

    @Operation(summary = "다음 대기자 호출", description = "부스 관리자가 호출 가능한 다음 대기자를 앞큐로 이동시킵니다.")
    @PatchMapping("/booths/me/waitings/call")
    public ResponseEntity<BaseResponse<WaitingCallResDto>> callNextWaiting(
            @RequestHeader("X-Booth-Id") final Long boothId
    ) {
        final WaitingCallResDto response = waitingService.callNextWaiting(boothId);
        return ResponseUtils.ok(response);
    }

    @Operation(summary = "대기 취소", description = "관람객이 자신의 대기 내역을 직접 취소합니다.")
    @DeleteMapping("/waitings/{waitingId}")
    public ResponseEntity<BaseResponse<Void>> cancelWaiting(
            @PathVariable final Long waitingId,
            @RequestHeader("X-Visitor-Id") final Long visitorId
    ) {
        waitingService.cancelWaiting(waitingId, visitorId);
        return ResponseUtils.ok(null);
    }

    @Operation(summary = "관리자 대기 취소", description = "부스 관리자가 대기 또는 노쇼 대상을 취소 처리합니다.")
    @DeleteMapping("/waitings/{waitingId}/admin")
    public ResponseEntity<BaseResponse<Void>> cancelWaitingByAdmin(
            @PathVariable final Long waitingId,
            @RequestHeader("X-Booth-Id") final Long boothId
    ) {
        waitingService.cancelWaitingByAdmin(waitingId, boothId);
        return ResponseUtils.ok(null);
    }

    @Operation(summary = "대기 순번 미루기", description = "관람객이 자신의 대기 순번을 한 칸 뒤로 미룹니다.")
    @PatchMapping("/waitings/{waitingId}/postpone")
    public ResponseEntity<BaseResponse<WaitingPostponeResDto>> postponeWaiting(
            @PathVariable final Long waitingId,
            @RequestHeader("X-Visitor-Id") final Long visitorId
    ) {
        final WaitingPostponeResDto response = waitingService.postponeWaiting(waitingId, visitorId);
        return ResponseUtils.ok(response);
    }

    @Operation(summary = "체험 입장 처리", description = "부스 관리자가 도착 확인이 끝난 대기를 입장 처리합니다.")
    @PatchMapping("/waitings/{waitingId}/admit")
    public ResponseEntity<BaseResponse<WaitingAdmitResDto>> admitWaiting(
            @PathVariable final Long waitingId,
            @RequestHeader("X-Booth-Id") final Long boothId
    ) {
        final WaitingAdmitResDto response = waitingService.admitWaiting(waitingId, boothId);
        return ResponseUtils.ok(response);
    }

    @Operation(summary = "이용 종료", description = "관람객이 체험을 마치고 퇴장 처리합니다.")
    @PatchMapping("/waitings/{waitingId}/exit")
    public ResponseEntity<BaseResponse<WaitingExitResDto>> exitWaiting(
            @PathVariable final Long waitingId,
            @RequestHeader("X-Visitor-Id") final Long visitorId
    ) {
        final WaitingExitResDto response = waitingService.exitWaiting(waitingId, visitorId);
        return ResponseUtils.ok(response);
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
