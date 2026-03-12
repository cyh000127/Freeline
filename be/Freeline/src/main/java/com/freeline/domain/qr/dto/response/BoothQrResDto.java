package com.freeline.domain.qr.dto.response;

import java.time.LocalDateTime;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
public record BoothQrResDto(

        @Schema(description = "QR ID", example = "1")
        Long qrId,

        @Schema(description = "부스 ID", example = "12")
        Long boothId,

        @Schema(description = "QR 용도", example = "FRONT_QUEUE_ARRIVAL")
        String purpose,

        @Schema(description = "QR payload 원문", example = "FREELINE|FRONT_QUEUE_ARRIVAL|v1|12|a5c0f343-5217-4694-9f96-b2f6110ff5bf")
        String qrCode,

        @Schema(description = "발급 시각", example = "2026-03-12T10:00:00")
        LocalDateTime issuedAt,

        @Schema(description = "만료 시각", example = "2026-04-11T10:00:00")
        LocalDateTime expiresAt,

        @Schema(description = "QR 상태", example = "ACTIVE")
        String status
) {
}