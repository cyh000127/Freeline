package com.freeline.domain.pushnotification.dto.message;

import java.util.UUID;

import lombok.Builder;

import com.freeline.domain.pushnotification.entity.PushNotificationType;

@Builder
public record WaitingFcmTaskMessage(
        UUID eventId,
        Long waitingId,
        Long boothId,
        Long visitorId,
        String expectedStatus,
        PushNotificationType notificationType
) {
}
