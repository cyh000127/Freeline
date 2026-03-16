package com.freeline.domain.pushnotification.dto.response;

import java.time.LocalDateTime;

import lombok.Builder;

import com.freeline.domain.pushnotification.entity.PushNotificationType;

@Builder
public record PushNotificationSendResDto(
        Long waitingId,
        Long visitorId,
        Long boothId,
        PushNotificationType notificationType,
        String status,
        LocalDateTime calledAt,
        LocalDateTime expiredAt,
        int targetCount
) {
}
