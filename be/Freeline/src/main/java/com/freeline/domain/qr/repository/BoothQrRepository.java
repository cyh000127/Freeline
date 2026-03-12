package com.freeline.domain.qr.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.freeline.domain.qr.entity.BoothQr;
import com.freeline.domain.qr.entity.BoothQrStatus;
import com.freeline.domain.qr.entity.QrPurpose;

public interface BoothQrRepository extends JpaRepository<BoothQr, Long> {

    Optional<BoothQr> findFirstByBoothIdAndPurposeAndStatusOrderByIdDesc(
            Long boothId,
            QrPurpose purpose,
            BoothQrStatus status
    );

    Optional<BoothQr> findByBoothIdAndPurposeAndQrKeyAndStatus(
            Long boothId,
            QrPurpose purpose,
            String qrKey,
            BoothQrStatus status
    );
}