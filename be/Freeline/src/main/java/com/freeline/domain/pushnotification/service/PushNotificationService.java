package com.freeline.domain.pushnotification.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.freeline.common.error.ErrorCode;
import com.freeline.domain.booth.entity.Booth;
import com.freeline.domain.booth.entity.BoothWaiting;
import com.freeline.domain.booth.entity.WaitingStatus;
import com.freeline.domain.booth.exception.BoothException;
import com.freeline.domain.booth.repository.BoothRepository;
import com.freeline.domain.booth.repository.BoothWaitingRepository;
import com.freeline.domain.booth.repository.VisitorRepository;
import com.freeline.domain.pushnotification.converter.PushNotificationConverter;
import com.freeline.domain.pushnotification.dto.request.FcmTokenUpsertReqDto;
import com.freeline.domain.pushnotification.dto.request.PushNotificationSendReqDto;
import com.freeline.domain.pushnotification.dto.response.FcmTokenResDto;
import com.freeline.domain.pushnotification.dto.response.PushNotificationSendResDto;
import com.freeline.domain.pushnotification.entity.FcmToken;
import com.freeline.domain.pushnotification.entity.PushNotificationType;
import com.freeline.domain.pushnotification.exception.PushNotificationException;
import com.freeline.domain.pushnotification.repository.FcmTokenRepository;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class PushNotificationService {

    private final VisitorRepository visitorRepository;
    private final BoothRepository boothRepository;
    private final BoothWaitingRepository boothWaitingRepository;
    private final FcmTokenRepository fcmTokenRepository;
    private final PushNotificationSender pushNotificationSender;

    public FcmTokenResDto upsertFcmToken(final FcmTokenUpsertReqDto request) {
        validateVisitorExists(request.visitorId());

        final FcmToken saved = fcmTokenRepository.findByDeviceId(request.deviceId())
                .map(existing -> {
                    existing.updateToken(request.fcmToken(), request.platform());
                    return existing;
                })
                .orElseGet(() -> fcmTokenRepository.save(PushNotificationConverter.toEntity(request)));

        log.info(
                "[PushNotification] FCM 토큰 저장 완료 {tokenId: {}, visitorId: {}, deviceId: {}, token: {}}",
                saved.getId(),
                saved.getVisitorId(),
                saved.getDeviceId(),
                PushNotificationConverter.maskToken(saved.getFcmToken())
        );

        return PushNotificationConverter.toFcmTokenResDto(saved);
    }

    public PushNotificationSendResDto sendNotification(
            final Long waitingId,
            final PushNotificationSendReqDto request
    ) {
        if (!pushNotificationSender.isActive()) {
            throw new PushNotificationException(ErrorCode.PUSH_NOTIFICATION_NOT_CONFIGURED);
        }

        final BoothWaiting waiting = boothWaitingRepository.findById(waitingId)
                .orElseThrow(() -> new PushNotificationException(ErrorCode.NOT_FOUND));
        final Booth booth = boothRepository.findById(waiting.getBoothId())
                .orElseThrow(() -> new BoothException(ErrorCode.BOOTH_NOT_FOUND));
        final List<FcmToken> tokens = fcmTokenRepository.findAllByVisitorIdOrderByIdAsc(waiting.getVisitorId());

        if (tokens.isEmpty()) {
            throw new PushNotificationException(ErrorCode.PUSH_NOTIFICATION_TOKEN_NOT_FOUND);
        }

        validateWaitingStatusForNotification(waiting, request.notificationType());

        final String title = request.notificationType().resolveTitle();
        final String boothLabel = resolveBoothLabel(booth);
        final String body = request.notificationType().resolveBody(boothLabel, request.customMessage());
        final Map<String, String> data = buildNotificationData(waiting, request.notificationType());

        tokens.forEach(token -> pushNotificationSender.sendToToken(token.getFcmToken(), title, body, data));

        log.info(
                "[PushNotification] 알림 발송 완료 {waitingId: {}, visitorId: {}, type: {}, targetCount: {}}",
                waiting.getId(),
                waiting.getVisitorId(),
                request.notificationType(),
                tokens.size()
        );

        return PushNotificationConverter.toPushNotificationSendResDto(waiting, request.notificationType(), tokens.size());
    }

    private void validateVisitorExists(final Long visitorId) {
        if (!visitorRepository.existsById(visitorId)) {
            throw new PushNotificationException(ErrorCode.NOT_FOUND);
        }
    }

    private void validateWaitingStatusForNotification(
            final BoothWaiting waiting,
            final PushNotificationType notificationType
    ) {
        switch (notificationType) {
            case FRONT_QUEUE_CALLED, QR_CHECK_REMINDER, WAITING_EXPIRED -> {
                if (waiting.getStatus() != WaitingStatus.CALLED) {
                    throw new PushNotificationException(ErrorCode.PUSH_NOTIFICATION_WAITING_STATUS_MISMATCH);
                }
            }
            case EXIT_ACTION_REQUIRED -> {
                if (waiting.getStatus() != WaitingStatus.ENTERED) {
                    throw new PushNotificationException(ErrorCode.PUSH_NOTIFICATION_WAITING_STATUS_MISMATCH);
                }
            }
            default -> throw new PushNotificationException(ErrorCode.INVALID_INPUT);
        }
    }

    private Map<String, String> buildNotificationData(
            final BoothWaiting waiting,
            final PushNotificationType notificationType
    ) {
        final Map<String, String> data = new LinkedHashMap<>();
        data.put("type", notificationType.name());
        data.put("waitingId", String.valueOf(waiting.getId()));
        data.put("visitorId", String.valueOf(waiting.getVisitorId()));
        data.put("boothId", String.valueOf(waiting.getBoothId()));

        if (waiting.getCallExpiresAt() != null) {
            data.put("expiredAt", waiting.getCallExpiresAt().toString());
        }

        return data;
    }

    private String resolveBoothLabel(final Booth booth) {
        if (StringUtils.hasText(booth.getLocationCode())) {
            return booth.getLocationCode();
        }

        return booth.getName();
    }
}
