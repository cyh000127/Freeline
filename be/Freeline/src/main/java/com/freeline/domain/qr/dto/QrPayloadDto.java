package com.freeline.domain.qr.dto;

import lombok.Builder;

@Builder
public record QrPayloadDto(
        String prefix,
        String purpose,
        String payloadVersion,
        Long boothId,
        String qrKey
) {
}
