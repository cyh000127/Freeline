package com.freeline.domain.pushnotification.dto.response;

import java.time.LocalDateTime;

import lombok.Builder;

import com.freeline.domain.pushnotification.entity.NotificationPlatform;

@Builder
public record FcmTokenResDto(
        Long tokenId,
        Long visitorId,
        String deviceId,
        NotificationPlatform platform,
        LocalDateTime updatedAt
) {
}
