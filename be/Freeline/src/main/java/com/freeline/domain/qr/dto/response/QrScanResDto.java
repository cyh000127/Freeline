package com.freeline.domain.qr.dto.response;

import java.time.LocalDateTime;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
public record QrScanResDto(

        @Schema(description = "QR ID", example = "1")
        Long qrId,

        @Schema(description = "부스 ID", example = "12")
        Long boothId,

        @Schema(description = "대기 ID", example = "100")
        Long waitingId,

        @Schema(description = "방문자 ID", example = "21")
        Long visitorId,

        @Schema(description = "이전 상태", example = "CALLED")
        String previousStatus,

        @Schema(description = "변경 상태", example = "REGISTERED")
        String currentStatus,

        @Schema(description = "앞큐 등록 시각", example = "2026-03-12T10:05:00")
        LocalDateTime registeredAt
) {
}