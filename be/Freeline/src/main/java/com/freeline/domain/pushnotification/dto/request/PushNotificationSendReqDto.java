package com.freeline.domain.pushnotification.dto.request;

import jakarta.validation.constraints.NotNull;

import lombok.Builder;

import com.freeline.domain.pushnotification.entity.PushNotificationType;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
public record PushNotificationSendReqDto(

        @Schema(description = "발송할 알림 종류", example = "FRONT_QUEUE_CALLED")
        @NotNull(message = "알림 종류는 필수입니다.")
        PushNotificationType notificationType,

        @Schema(description = "직접 덮어쓸 알림 문구", example = "앞으로 와주세요")
        String customMessage
) {
}
