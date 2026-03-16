package com.freeline.domain.pushnotification.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import lombok.Builder;

import com.freeline.domain.pushnotification.entity.NotificationPlatform;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
public record FcmTokenUpsertReqDto(

        @Schema(description = "방문자 ID", example = "21")
        @NotNull(message = "방문자 ID는 필수입니다.")
        Long visitorId,

        @Schema(description = "기기 고유 식별자", example = "android-21d2f5d1")
        @NotBlank(message = "기기 ID는 필수입니다.")
        String deviceId,

        @Schema(description = "FCM registration token", example = "eYJhbGciOi...")
        @NotBlank(message = "FCM 토큰은 필수입니다.")
        String fcmToken,

        @Schema(description = "디바이스 플랫폼", example = "ANDROID")
        @NotNull(message = "플랫폼은 필수입니다.")
        NotificationPlatform platform
) {
}
