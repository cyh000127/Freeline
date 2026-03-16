package com.freeline.domain.pushnotification.converter;

import lombok.experimental.UtilityClass;

import com.freeline.domain.booth.entity.BoothWaiting;
import com.freeline.domain.pushnotification.dto.request.FcmTokenUpsertReqDto;
import com.freeline.domain.pushnotification.dto.response.FcmTokenResDto;
import com.freeline.domain.pushnotification.dto.response.PushNotificationSendResDto;
import com.freeline.domain.pushnotification.entity.FcmToken;
import com.freeline.domain.pushnotification.entity.PushNotificationType;

@UtilityClass
public class PushNotificationConverter {

    public static FcmToken toEntity(final FcmTokenUpsertReqDto request) {
        return FcmToken.builder()
                .visitorId(request.visitorId())
                .deviceId(request.deviceId())
                .fcmToken(request.fcmToken())
                .platform(request.platform())
                .build();
    }

    public static FcmTokenResDto toFcmTokenResDto(final FcmToken fcmToken) {
        return FcmTokenResDto.builder()
                .tokenId(fcmToken.getId())
                .visitorId(fcmToken.getVisitorId())
                .deviceId(fcmToken.getDeviceId())
                .platform(fcmToken.getPlatform())
                .updatedAt(fcmToken.getUpdatedAt())
                .build();
    }

    public static PushNotificationSendResDto toPushNotificationSendResDto(
            final BoothWaiting waiting,
            final PushNotificationType notificationType,
            final int targetCount
    ) {
        return PushNotificationSendResDto.builder()
                .waitingId(waiting.getId())
                .visitorId(waiting.getVisitorId())
                .boothId(waiting.getBoothId())
                .notificationType(notificationType)
                .status(waiting.getStatus().name())
                .calledAt(waiting.getCalledAt())
                .expiredAt(waiting.getCallExpiresAt())
                .targetCount(targetCount)
                .build();
    }

    public static String maskToken(final String fcmToken) {
        if (fcmToken == null || fcmToken.length() <= 8) {
            return fcmToken;
        }

        return fcmToken.substring(0, 4) + "..." + fcmToken.substring(fcmToken.length() - 4);
    }
}
