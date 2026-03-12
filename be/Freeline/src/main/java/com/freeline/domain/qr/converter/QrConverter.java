package com.freeline.domain.qr.converter;

import java.time.LocalDateTime;

import lombok.experimental.UtilityClass;

import com.freeline.common.util.QrCodeUtil;
import com.freeline.domain.booth.entity.BoothWaiting;
import com.freeline.domain.qr.dto.response.BoothQrResDto;
import com.freeline.domain.qr.dto.response.QrScanResDto;
import com.freeline.domain.qr.entity.BoothQr;
import com.freeline.domain.qr.entity.BoothQrStatus;
import com.freeline.domain.qr.entity.QrPurpose;

@UtilityClass
public class QrConverter {

    public BoothQr toEntity(
            final Long boothId,
            final QrPurpose purpose,
            final String qrKey,
            final String payloadVersion,
            final LocalDateTime issuedAt,
            final LocalDateTime expiresAt
    ) {
        return BoothQr.builder()
                .boothId(boothId)
                .purpose(purpose)
                .qrKey(qrKey)
                .payloadVersion(payloadVersion)
                .issuedAt(issuedAt)
                .expiresAt(expiresAt)
                .status(BoothQrStatus.ACTIVE)
                .build();
    }

    public BoothQrResDto toBoothQrResDto(final BoothQr boothQr, final String prefix) {
        return BoothQrResDto.builder()
                .qrId(boothQr.getId())
                .boothId(boothQr.getBoothId())
                .purpose(boothQr.getPurpose().name())
                .qrCode(QrCodeUtil.generatePayload(
                        prefix,
                        boothQr.getPurpose().name(),
                        boothQr.getPayloadVersion(),
                        boothQr.getBoothId(),
                        boothQr.getQrKey()
                ))
                .issuedAt(boothQr.getIssuedAt())
                .expiresAt(boothQr.getExpiresAt())
                .status(boothQr.getStatus().name())
                .build();
    }

    public QrScanResDto toQrScanResDto(
            final BoothQr boothQr,
            final BoothWaiting waiting,
            final String previousStatus
    ) {
        return QrScanResDto.builder()
                .qrId(boothQr.getId())
                .boothId(boothQr.getBoothId())
                .waitingId(waiting.getId())
                .visitorId(waiting.getVisitorId())
                .previousStatus(previousStatus)
                .currentStatus(waiting.getStatus().name())
                .registeredAt(waiting.getRegisteredAt())
                .build();
    }
}