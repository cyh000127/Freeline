package com.freeline.domain.pushnotification.controller;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

import com.freeline.common.response.BaseResponse;
import com.freeline.common.util.ResponseUtils;
import com.freeline.domain.pushnotification.dto.request.FcmTokenUpsertReqDto;
import com.freeline.domain.pushnotification.dto.request.PushNotificationSendReqDto;
import com.freeline.domain.pushnotification.dto.response.FcmTokenResDto;
import com.freeline.domain.pushnotification.dto.response.PushNotificationSendResDto;
import com.freeline.domain.pushnotification.service.PushNotificationService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "PushNotification", description = "푸시 알림 관리 API")
@RestController
@RequestMapping("/api/v1/push-notifications")
@RequiredArgsConstructor
public class PushNotificationController {

    private final PushNotificationService pushNotificationService;

    @Operation(summary = "FCM 토큰 저장", description = "방문자 앱의 deviceId와 FCM 토큰을 저장하거나 갱신합니다.")
    @PostMapping("/tokens")
    public ResponseEntity<BaseResponse<FcmTokenResDto>> upsertFcmToken(
            @Valid @RequestBody final FcmTokenUpsertReqDto request
    ) {
        final FcmTokenResDto response = pushNotificationService.upsertFcmToken(request);
        return ResponseUtils.created(response);
    }

    @Operation(summary = "대기 사용자 푸시 알림 발송", description = "waiting 상태를 기준으로 사용자에게 푸시 알림을 발송합니다.")
    @PostMapping("/waitings/{waitingId}")
    public ResponseEntity<BaseResponse<PushNotificationSendResDto>> sendNotification(
            @PathVariable final Long waitingId,
            @Valid @RequestBody final PushNotificationSendReqDto request
    ) {
        final PushNotificationSendResDto response = pushNotificationService.sendNotification(waitingId, request);
        return ResponseUtils.ok(response);
    }
}
