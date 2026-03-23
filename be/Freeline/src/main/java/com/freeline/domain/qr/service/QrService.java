package com.freeline.domain.qr.service;

import java.time.Duration;
import java.time.LocalDateTime;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.freeline.common.config.properties.QrProperties;
import com.freeline.common.error.ErrorCode;
import com.freeline.common.event.waiting.detector.WaitingStatusChangeCommand;
import com.freeline.common.event.waiting.dispatcher.WaitingEventDispatcher;
import com.freeline.common.util.QrCodeUtil;
import com.freeline.common.util.TimeUtils;
import com.freeline.domain.booth.entity.BoothPolicy;
import com.freeline.domain.booth.entity.BoothWaiting;
import com.freeline.domain.booth.entity.WaitingStatus;
import com.freeline.domain.booth.exception.BoothException;
import com.freeline.domain.booth.repository.BoothPolicyRepository;
import com.freeline.domain.booth.repository.BoothRepository;
import com.freeline.domain.booth.repository.BoothWaitingRepository;
import com.freeline.domain.qr.converter.QrConverter;
import com.freeline.domain.qr.dto.QrPayloadDto;
import com.freeline.domain.qr.dto.request.QrScanReqDto;
import com.freeline.domain.qr.dto.response.BoothQrResDto;
import com.freeline.domain.qr.dto.response.QrScanResDto;
import com.freeline.domain.qr.entity.BoothQr;
import com.freeline.domain.qr.entity.BoothQrStatus;
import com.freeline.domain.qr.entity.QrPurpose;
import com.freeline.domain.qr.exception.QrException;
import com.freeline.domain.qr.repository.BoothQrRepository;
import com.freeline.domain.waiting.service.WaitingStatusPersistenceService;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class QrService {

    private static final String QR_PREFIX = "FREELINE";
    private static final String QR_PAYLOAD_VERSION = "v1";
    private static final QrPurpose BOOTH_QR_PURPOSE = QrPurpose.FRONT_QUEUE_ARRIVAL;

    private final BoothRepository boothRepository;
    private final BoothPolicyRepository boothPolicyRepository;
    private final BoothWaitingRepository boothWaitingRepository;
    private final BoothQrRepository boothQrRepository;
    private final StringRedisTemplate stringRedisTemplate;
    private final QrProperties qrProperties;
    private final WaitingEventDispatcher waitingEventDispatcher;
    private final WaitingStatusPersistenceService waitingStatusPersistenceService;

    // TODO: visitor 인증이 붙으면 scanQr()에서 visitorId를 request body로 받지 않고 인증 정보에서 추출하도록 변경한다.
    // TODO: booth_qr 이력 정리 및 만료 QR 배치 정리 정책이 필요하면 별도 스케줄러로 분리한다.
    // TODO: CALLED -> REGISTERED 로 바뀌는 시점에 BoothManagerSseService와 연결해 부스 관리자 화면에 도착 확인 이벤트를 전파한다.

    // 부스에 붙여둘 고정형 QR을 생성한다. 이미 활성 QR이 있으면 기존 QR을 그대로 돌려준다.
    public BoothQrResDto createBoothQr(final Long boothId) {
        validateBoothExists(boothId);

        final BoothQr activeQr = boothQrRepository
                .findFirstByBoothIdAndPurposeAndStatusOrderByIdDesc(boothId, getBoothPurpose(), BoothQrStatus.ACTIVE)
                .map(this::expireIfNeeded)
                .orElse(null);

        if (activeQr != null && activeQr.getStatus() == BoothQrStatus.ACTIVE) {
            return QrConverter.toBoothQrResDto(activeQr, QR_PREFIX);
        }

        final BoothQr saved = boothQrRepository.save(createNewBoothQr(boothId));
        log.info("[QR] 부스 QR 생성 완료 {qrId: {}, boothId: {}}", saved.getId(), saved.getBoothId());
        return QrConverter.toBoothQrResDto(saved, QR_PREFIX);
    }

    // 현재 활성 상태인 부스 QR을 조회한다.
    @Transactional(readOnly = true)
    public BoothQrResDto getBoothQr(final Long boothId) {
        validateBoothExists(boothId);
        final BoothQr boothQr = boothQrRepository
                .findFirstByBoothIdAndPurposeAndStatusOrderByIdDesc(boothId, getBoothPurpose(), BoothQrStatus.ACTIVE)
                .orElseThrow(() -> new QrException(ErrorCode.QR_NOT_FOUND));

        if (boothQr.getExpiresAt().isBefore(TimeUtils.nowDateTime())) {
            throw new QrException(ErrorCode.QR_EXPIRED);
        }

        return QrConverter.toBoothQrResDto(boothQr, QR_PREFIX);
    }

    // 기존 QR을 더 이상 쓰지 못하게 바꾸고 새 QR을 발급한다.
    public BoothQrResDto reissueBoothQr(final Long boothId) {
        validateBoothExists(boothId);
        validateReissueCooldown(boothId);

        boothQrRepository.findFirstByBoothIdAndPurposeAndStatusOrderByIdDesc(boothId, getBoothPurpose(), BoothQrStatus.ACTIVE)
                .ifPresent(existing -> existing.updateStatus(BoothQrStatus.REISSUED));

        final BoothQr saved = boothQrRepository.save(createNewBoothQr(boothId));
        setReissueCooldown(boothId);

        log.info("[QR] 부스 QR 재발급 완료 {qrId: {}, boothId: {}}", saved.getId(), saved.getBoothId());
        return QrConverter.toBoothQrResDto(saved, QR_PREFIX);
    }

    // 사용자가 스캔한 QR을 검증하고 호출 상태라면 앞큐 등록 상태로 변경한다.
    public QrScanResDto scanQr(final QrScanReqDto request, final Long visitorId) {
        final QrPayloadDto payload = parsePayload(request.qrCode());
        validatePayloadPrefix(payload);

        final String lockKey = buildScanLockKey(payload.boothId(), visitorId);
        final Boolean locked = stringRedisTemplate.opsForValue().setIfAbsent(
                lockKey,
                "1",
                Duration.ofSeconds(qrProperties.scanLockSeconds())
        );

        if (!Boolean.TRUE.equals(locked)) {
            throw new QrException(ErrorCode.QR_SCAN_IN_PROGRESS);
        }

        try {
            final BoothQr boothQr = getActiveBoothQr(payload.boothId(), payload.qrKey());
            final BoothWaiting waiting = boothWaitingRepository
                    .findFirstByBoothIdAndVisitorIdAndStatusOrderByCalledAtDesc(
                            payload.boothId(),
                            visitorId,
                            WaitingStatus.CALLED
                    )
                    .orElseThrow(() -> new QrException(ErrorCode.QR_WAITING_NOT_CALLED));

            validateWaitingCallWindow(waiting, payload.boothId());

            final String previousStatus = waiting.getStatus().name();
            waiting.updateStatus(WaitingStatus.REGISTERED);
            waiting.updateRegisteredAt(TimeUtils.nowDateTime());
            dispatchRegisteredStatusChanged(waiting, previousStatus);

            log.info(
                    "[QR] 스캔 등록 완료 {qrId: {}, boothId: {}, waitingId: {}, visitorId: {}}",
                    boothQr.getId(),
                    boothQr.getBoothId(),
                    waiting.getId(),
                    waiting.getVisitorId()
            );

            return QrConverter.toQrScanResDto(boothQr, waiting, previousStatus);
        } finally {
            stringRedisTemplate.delete(lockKey);
        }
    }

    // 새 QR 엔티티를 만들 때 발급 시각과 만료 시각을 함께 계산한다.
    private BoothQr createNewBoothQr(final Long boothId) {
        final LocalDateTime issuedAt = TimeUtils.nowDateTime();
        final LocalDateTime expiresAt = issuedAt.plusDays(qrProperties.boothActiveTtlDays());
        final String qrKey = QrCodeUtil.generateQrKey();

        return QrConverter.toEntity(
                boothId,
                getBoothPurpose(),
                qrKey,
                QR_PAYLOAD_VERSION,
                issuedAt,
                expiresAt
        );
    }

    // 현재 활성 QR과 스캔된 QR key가 일치하는지 확인한다.
    private BoothQr getActiveBoothQr(final Long boothId, final String qrKey) {
        final BoothQr boothQr = boothQrRepository
                .findByBoothIdAndPurposeAndQrKeyAndStatus(boothId, getBoothPurpose(), qrKey, BoothQrStatus.ACTIVE)
                .orElseThrow(() -> new QrException(ErrorCode.QR_NOT_FOUND));

        if (boothQr.getExpiresAt().isBefore(TimeUtils.nowDateTime())) {
            boothQr.updateStatus(BoothQrStatus.EXPIRED);
            throw new QrException(ErrorCode.QR_EXPIRED);
        }

        return boothQr;
    }

    // 활성 QR을 조회할 때 이미 만료되었으면 상태를 EXPIRED로 바꿔둔다.
    private BoothQr expireIfNeeded(final BoothQr boothQr) {
        if (boothQr.getExpiresAt().isBefore(TimeUtils.nowDateTime())) {
            boothQr.updateStatus(BoothQrStatus.EXPIRED);
        }
        return boothQr;
    }

    // 프론트가 보낸 QR 문자열을 서버 검증용 구조로 변환한다.
    private QrPayloadDto parsePayload(final String payload) {
        try {
            return QrCodeUtil.parsePayload(payload);
        } catch (final RuntimeException ex) {
            throw new QrException(ErrorCode.QR_INVALID_PAYLOAD);
        }
    }

    // 현재 서비스가 허용하는 QR 형식인지 prefix, 목적, 버전으로 검증한다.
    private void validatePayloadPrefix(final QrPayloadDto payload) {
        if (!QR_PREFIX.equals(payload.prefix())
                || !getBoothPurpose().name().equals(payload.purpose())
                || !QR_PAYLOAD_VERSION.equals(payload.payloadVersion())) {
            throw new QrException(ErrorCode.QR_INVALID_PAYLOAD);
        }
    }

    // 호출된 사용자가 아직 도착 확인 가능한 시간 안에 있는지 확인한다.
    private void validateWaitingCallWindow(final BoothWaiting waiting, final Long boothId) {
        final LocalDateTime now = TimeUtils.nowDateTime();
        final LocalDateTime expiresAt = resolveWaitingCallExpiresAt(waiting, boothId);

        if (expiresAt != null && expiresAt.isBefore(now)) {
            final boolean expired = waitingStatusPersistenceService.expireWaiting(waiting.getId(), expiresAt);
            if (!expired) {
                throw new QrException(ErrorCode.QR_WAITING_NOT_CALLED);
            }
            throw new QrException(ErrorCode.QR_WAITING_EXPIRED);
        }

        if (expiresAt != null) {
            waiting.updateCallExpiresAt(expiresAt);
        }
    }

    // 호출 만료 시간이 저장돼 있지 않으면 calledAt과 정책 시간을 바탕으로 계산한다.
    private LocalDateTime resolveWaitingCallExpiresAt(final BoothWaiting waiting, final Long boothId) {
        if (waiting.getCallExpiresAt() != null) {
            return waiting.getCallExpiresAt();
        }

        if (waiting.getCalledAt() == null) {
            return null;
        }

        final int callValidSeconds = boothPolicyRepository.findByBoothId(boothId)
                .map(BoothPolicy::getCallValidTime)
                .filter(value -> value > 0)
                .orElse(180);

        return waiting.getCalledAt().plusSeconds(callValidSeconds);
    }

    // 운영자가 버튼을 연속 클릭해도 과도한 재발급이 일어나지 않도록 제한한다.
    private void validateReissueCooldown(final Long boothId) {
        final String key = buildReissueCooldownKey(boothId);
        if (Boolean.TRUE.equals(stringRedisTemplate.hasKey(key))) {
            throw new QrException(ErrorCode.QR_REISSUE_COOLDOWN);
        }
    }

    // 재발급 직후 짧은 cooldown 키를 Redis에 저장한다.
    private void setReissueCooldown(final Long boothId) {
        stringRedisTemplate.opsForValue().set(
                buildReissueCooldownKey(boothId),
                "1",
                Duration.ofSeconds(qrProperties.reissueCooldownSeconds())
        );
    }

    // 같은 사용자의 중복 스캔 요청을 막기 위한 Redis lock key를 만든다.
    private String buildScanLockKey(final Long boothId, final Long visitorId) {
        return "qr:scan:lock:booth:%d:visitor:%d".formatted(boothId, visitorId);
    }

    // 같은 부스에서 재발급 cooldown을 체크하기 위한 Redis key를 만든다.
    private String buildReissueCooldownKey(final Long boothId) {
        return "qr:booth:%d:reissue:cooldown".formatted(boothId);
    }

    private QrPurpose getBoothPurpose() {
        return BOOTH_QR_PURPOSE;
    }

    private void validateBoothExists(final Long boothId) {
        if (!boothRepository.existsById(boothId)) {
            throw new BoothException(ErrorCode.BOOTH_NOT_FOUND);
        }
    }

    private void dispatchRegisteredStatusChanged(
            final BoothWaiting waiting,
            final String previousStatus
    ) {
        waitingEventDispatcher.dispatch(
                new WaitingStatusChangeCommand(
                        com.freeline.common.event.waiting.model.WaitingEventType.WAITING_REGISTERED,
                        waiting.getId(),
                        waiting.getBoothId(),
                        waiting.getVisitorId(),
                        previousStatus,
                        waiting.getStatus().name()
                )
        );
    }
}
