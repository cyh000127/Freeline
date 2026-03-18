package com.freeline.common.util;

import java.util.UUID;

import lombok.experimental.UtilityClass;

import com.freeline.domain.qr.dto.QrPayloadDto;

@UtilityClass
public class QrCodeUtil {

    private static final String DELIMITER = "|";
    private static final int PAYLOAD_PART_SIZE = 5;

    // QR key는 부스 QR을 유일하게 식별하기 위한 난수 값이다.
    public String generateQrKey() {
        return UUID.randomUUID().toString();
    }

    // QR payload는 prefix, 목적, 버전, 부스 ID, QR key를 순서대로 묶어 만든다.
    public String generatePayload(
            final String prefix,
            final String purpose,
            final String payloadVersion,
            final Long boothId,
            final String qrKey
    ) {
        return String.join(DELIMITER, prefix, purpose, payloadVersion, String.valueOf(boothId), qrKey);
    }

    // 스캔된 QR 문자열을 서버에서 검증 가능한 형태로 다시 분해한다.
    public QrPayloadDto parsePayload(final String payload) {
        final String[] parts = payload.split("\\|", -1);
        if (parts.length != PAYLOAD_PART_SIZE) {
            throw new IllegalArgumentException("Invalid QR payload format");
        }

        return QrPayloadDto.builder()
                .prefix(parts[0])
                .purpose(parts[1])
                .payloadVersion(parts[2])
                .boothId(Long.parseLong(parts[3]))
                .qrKey(parts[4])
                .build();
    }
}
