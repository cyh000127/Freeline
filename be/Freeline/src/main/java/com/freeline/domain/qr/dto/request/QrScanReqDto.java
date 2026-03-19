package com.freeline.domain.qr.dto.request;

import jakarta.validation.constraints.NotBlank;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
public record QrScanReqDto(

        @Schema(description = "스캔한 QR payload 원문", example = "FREELINE|FRONT_QUEUE_ARRIVAL|v1|12|a5c0f343-5217-4694-9f96-b2f6110ff5bf")
        @NotBlank(message = "QR payload는 필수입니다.")
        String qrCode
) {
}
