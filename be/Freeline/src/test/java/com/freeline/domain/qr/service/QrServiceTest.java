package com.freeline.domain.qr.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import com.freeline.common.config.properties.QrProperties;
import com.freeline.common.event.waiting.dispatcher.WaitingEventDispatcher;
import com.freeline.common.util.TimeUtils;
import com.freeline.domain.booth.entity.BoothWaiting;
import com.freeline.domain.booth.entity.WaitingStatus;
import com.freeline.domain.booth.repository.BoothPolicyRepository;
import com.freeline.domain.booth.repository.BoothRepository;
import com.freeline.domain.booth.repository.BoothWaitingRepository;
import com.freeline.domain.qr.dto.request.QrScanReqDto;
import com.freeline.domain.qr.dto.response.BoothQrResDto;
import com.freeline.domain.qr.entity.BoothQr;
import com.freeline.domain.qr.entity.BoothQrStatus;
import com.freeline.domain.qr.entity.QrPurpose;
import com.freeline.domain.qr.exception.QrException;
import com.freeline.domain.qr.repository.BoothQrRepository;
import com.freeline.domain.waiting.assembler.WaitingEventSnapshotAssembler;
import com.freeline.domain.waiting.service.WaitingStatusPersistenceService;

@ExtendWith(MockitoExtension.class)
class QrServiceTest {

    private static final LocalDateTime FIXED_NOW = LocalDateTime.of(2026, 3, 19, 18, 0);

    @Mock
    private BoothRepository boothRepository;

    @Mock
    private BoothPolicyRepository boothPolicyRepository;

    @Mock
    private BoothWaitingRepository boothWaitingRepository;

    @Mock
    private BoothQrRepository boothQrRepository;

    @Mock
    private StringRedisTemplate stringRedisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @Mock
    private WaitingEventDispatcher waitingEventDispatcher;

    @Mock
    private WaitingStatusPersistenceService waitingStatusPersistenceService;

    private QrService qrService;
    private MockedStatic<TimeUtils> timeUtilsMock;

    @BeforeEach
    void setUp() {
        timeUtilsMock = Mockito.mockStatic(TimeUtils.class);
        timeUtilsMock.when(TimeUtils::nowDateTime).thenReturn(FIXED_NOW);
        timeUtilsMock.when(TimeUtils::today).thenReturn(FIXED_NOW.toLocalDate());
        timeUtilsMock.when(TimeUtils::nowTime).thenReturn(FIXED_NOW.toLocalTime());

        final QrProperties qrProperties = new QrProperties(30L, 30L, 5L);
        qrService = new QrService(
                boothRepository,
                boothPolicyRepository,
                boothWaitingRepository,
                boothQrRepository,
                stringRedisTemplate,
                qrProperties,
                waitingEventDispatcher,
                waitingStatusPersistenceService,
                new WaitingEventSnapshotAssembler()
        );
    }

    @AfterEach
    void tearDown() {
        timeUtilsMock.close();
    }

    @Test
    void 부스_QR_생성_성공() {
        final BoothQr saved = BoothQr.builder()
                .id(1L)
                .boothId(12L)
                .purpose(QrPurpose.FRONT_QUEUE_ARRIVAL)
                .qrKey("fixed-key")
                .payloadVersion("v1")
                .issuedAt(LocalDateTime.of(2026, 3, 12, 10, 0))
                .expiresAt(LocalDateTime.of(2026, 4, 11, 10, 0))
                .status(BoothQrStatus.ACTIVE)
                .build();

        Mockito.when(boothRepository.existsById(12L)).thenReturn(true);
        Mockito.when(boothQrRepository.findFirstByBoothIdAndPurposeAndStatusOrderByIdDesc(
                12L,
                QrPurpose.FRONT_QUEUE_ARRIVAL,
                BoothQrStatus.ACTIVE
        )).thenReturn(Optional.empty());
        Mockito.when(boothQrRepository.save(Mockito.any(BoothQr.class))).thenReturn(saved);

        final BoothQrResDto result = qrService.createBoothQr(12L);

        Assertions.assertThat(result.qrId()).isEqualTo(1L);
        Assertions.assertThat(result.boothId()).isEqualTo(12L);
        Assertions.assertThat(result.qrCode()).contains("FREELINE|FRONT_QUEUE_ARRIVAL|v1|12|");
    }

    @Test
    void 부스_QR_재발급_성공() {
        final BoothQr active = BoothQr.builder()
                .id(1L)
                .boothId(12L)
                .purpose(QrPurpose.FRONT_QUEUE_ARRIVAL)
                .qrKey("old-key")
                .payloadVersion("v1")
                .issuedAt(LocalDateTime.of(2026, 3, 12, 10, 0))
                .expiresAt(LocalDateTime.of(2026, 4, 11, 10, 0))
                .status(BoothQrStatus.ACTIVE)
                .build();

        final BoothQr saved = BoothQr.builder()
                .id(2L)
                .boothId(12L)
                .purpose(QrPurpose.FRONT_QUEUE_ARRIVAL)
                .qrKey("new-key")
                .payloadVersion("v1")
                .issuedAt(LocalDateTime.of(2026, 3, 12, 10, 1))
                .expiresAt(LocalDateTime.of(2026, 4, 11, 10, 1))
                .status(BoothQrStatus.ACTIVE)
                .build();

        Mockito.when(boothRepository.existsById(12L)).thenReturn(true);
        Mockito.when(stringRedisTemplate.hasKey("qr:booth:12:reissue:cooldown")).thenReturn(false);
        Mockito.when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        Mockito.when(boothQrRepository.findFirstByBoothIdAndPurposeAndStatusOrderByIdDesc(
                12L,
                QrPurpose.FRONT_QUEUE_ARRIVAL,
                BoothQrStatus.ACTIVE
        )).thenReturn(Optional.of(active));
        Mockito.when(boothQrRepository.save(Mockito.any(BoothQr.class))).thenReturn(saved);

        final BoothQrResDto result = qrService.reissueBoothQr(12L);

        Assertions.assertThat(result.qrId()).isEqualTo(2L);
        Assertions.assertThat(active.getStatus()).isEqualTo(BoothQrStatus.REISSUED);
        Mockito.verify(valueOperations).set(
                Mockito.eq("qr:booth:12:reissue:cooldown"),
                Mockito.eq("1"),
                Mockito.eq(Duration.ofSeconds(30L))
        );
    }

//    @Test
//    void QR_스캔_성공() {
//        final BoothQr boothQr = BoothQr.builder()
//                .id(1L)
//                .boothId(12L)
//                .purpose(QrPurpose.FRONT_QUEUE_ARRIVAL)
//                .qrKey("fixed-key")
//                .payloadVersion("v1")
//                .issuedAt(LocalDateTime.of(2026, 3, 12, 10, 0))
//                .expiresAt(LocalDateTime.now().plusDays(1))
//                .status(BoothQrStatus.ACTIVE)
//                .build();
//
//        final BoothWaiting waiting = BoothWaiting.builder()
//                .id(100L)
//                .boothId(12L)
//                .visitorId(21L)
//                .status(WaitingStatus.CALLED)
//                .waitingNumber(7)
//                .deferCount(0)
//                .requestedAt(LocalDateTime.of(2026, 3, 12, 9, 30))
//                .calledAt(LocalDateTime.now().minusMinutes(1))
//                .callExpiresAt(LocalDateTime.now().plusMinutes(2))
//                .build();
//
//        Mockito.when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
//        Mockito.when(valueOperations.setIfAbsent(
//                Mockito.eq("qr:scan:lock:booth:12:visitor:21"),
//                Mockito.eq("1"),
//                Mockito.eq(Duration.ofSeconds(5L))
//        )).thenReturn(true);
//        Mockito.when(boothQrRepository.findByBoothIdAndPurposeAndQrKeyAndStatus(
//                12L,
//                QrPurpose.FRONT_QUEUE_ARRIVAL,
//                "fixed-key",
//                BoothQrStatus.ACTIVE
//        )).thenReturn(Optional.of(boothQr));
//        Mockito.when(boothWaitingRepository.findFirstByBoothIdAndVisitorIdAndStatusOrderByCalledAtDesc(
//                12L,
//                21L,
//                WaitingStatus.CALLED
//        )).thenReturn(Optional.of(waiting));
//
//        final QrScanResDto result = qrService.scanQr(
//                QrScanReqDto.builder()
//                        .qrCode("FREELINE|FRONT_QUEUE_ARRIVAL|v1|12|fixed-key")
//                        .build(),
//                21L
//        );
//
//        Assertions.assertThat(result.waitingId()).isEqualTo(100L);
//        Assertions.assertThat(result.previousStatus()).isEqualTo("CALLED");
//        Assertions.assertThat(result.currentStatus()).isEqualTo("REGISTERED");
//        Assertions.assertThat(waiting.getStatus()).isEqualTo(WaitingStatus.REGISTERED);
//        Assertions.assertThat(waiting.getRegisteredAt()).isNotNull();
//        Mockito.verify(stringRedisTemplate).delete("qr:scan:lock:booth:12:visitor:21");
//    }

    @Test
    void QR_스캔_실패_호출_대기_없음() {
        final BoothQr boothQr = BoothQr.builder()
                .id(1L)
                .boothId(12L)
                .purpose(QrPurpose.FRONT_QUEUE_ARRIVAL)
                .qrKey("fixed-key")
                .payloadVersion("v1")
                .issuedAt(LocalDateTime.of(2026, 3, 12, 10, 0))
                .expiresAt(FIXED_NOW.plusDays(1))
                .status(BoothQrStatus.ACTIVE)
                .build();

        Mockito.when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        Mockito.when(valueOperations.setIfAbsent(
                Mockito.eq("qr:scan:lock:booth:12:visitor:21"),
                Mockito.eq("1"),
                Mockito.eq(Duration.ofSeconds(5L))
        )).thenReturn(true);
        Mockito.when(boothQrRepository.findByBoothIdAndPurposeAndQrKeyAndStatus(
                12L,
                QrPurpose.FRONT_QUEUE_ARRIVAL,
                "fixed-key",
                BoothQrStatus.ACTIVE
        )).thenReturn(Optional.of(boothQr));
        Mockito.when(boothWaitingRepository.findFirstByBoothIdAndVisitorIdAndStatusOrderByCalledAtDesc(
                12L,
                21L,
                WaitingStatus.CALLED
        )).thenReturn(Optional.empty());

        Assertions.assertThatThrownBy(() -> qrService.scanQr(
                        QrScanReqDto.builder()
                                .qrCode("FREELINE|FRONT_QUEUE_ARRIVAL|v1|12|fixed-key")
                                .build(),
                        21L))
                .isInstanceOf(QrException.class)
                .hasMessage("호출 상태의 대기를 찾을 수 없습니다.");

        Mockito.verify(stringRedisTemplate).delete("qr:scan:lock:booth:12:visitor:21");
    }

    @Test
    void QR_스캔_실패_호출_만료시_EXPIRED_저장_요청() {
        final BoothQr boothQr = BoothQr.builder()
                .id(1L)
                .boothId(12L)
                .purpose(QrPurpose.FRONT_QUEUE_ARRIVAL)
                .qrKey("fixed-key")
                .payloadVersion("v1")
                .issuedAt(LocalDateTime.of(2026, 3, 12, 10, 0))
                .expiresAt(FIXED_NOW.plusDays(1))
                .status(BoothQrStatus.ACTIVE)
                .build();

        final com.freeline.domain.booth.entity.BoothWaiting waiting =
                com.freeline.domain.booth.entity.BoothWaiting.builder()
                        .id(100L)
                        .boothId(12L)
                        .visitorId(21L)
                        .status(WaitingStatus.CALLED)
                        .waitingNumber(7)
                        .deferCount(0)
                        .requestedAt(LocalDateTime.of(2026, 3, 12, 9, 30))
                        .calledAt(FIXED_NOW.minusMinutes(5))
                        .callExpiresAt(FIXED_NOW.minusMinutes(1))
                        .build();

        Mockito.when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        Mockito.when(valueOperations.setIfAbsent(
                Mockito.eq("qr:scan:lock:booth:12:visitor:21"),
                Mockito.eq("1"),
                Mockito.eq(Duration.ofSeconds(5L))
        )).thenReturn(true);
        Mockito.when(boothQrRepository.findByBoothIdAndPurposeAndQrKeyAndStatus(
                12L,
                QrPurpose.FRONT_QUEUE_ARRIVAL,
                "fixed-key",
                BoothQrStatus.ACTIVE
        )).thenReturn(Optional.of(boothQr));
        Mockito.when(boothWaitingRepository.findFirstByBoothIdAndVisitorIdAndStatusOrderByCalledAtDesc(
                12L,
                21L,
                WaitingStatus.CALLED
        )).thenReturn(Optional.of(waiting));
        Mockito.when(waitingStatusPersistenceService.expireWaiting(100L, FIXED_NOW.minusMinutes(1))).thenReturn(true);

        Assertions.assertThatThrownBy(() -> qrService.scanQr(
                        QrScanReqDto.builder()
                                .qrCode("FREELINE|FRONT_QUEUE_ARRIVAL|v1|12|fixed-key")
                                .build(),
                        21L))
                .isInstanceOf(QrException.class)
                .hasMessage("호출 유효 시간이 만료되었습니다.");

        Mockito.verify(waitingStatusPersistenceService)
                .expireWaiting(100L, FIXED_NOW.minusMinutes(1));
        Mockito.verify(stringRedisTemplate).delete("qr:scan:lock:booth:12:visitor:21");
    }

    @Test
    void QR_스캔_실패_호출_만료시_EXPIRED_저장_서비스를_호출한다() {
        final BoothQr boothQr = BoothQr.builder()
                .id(1L)
                .boothId(12L)
                .purpose(QrPurpose.FRONT_QUEUE_ARRIVAL)
                .qrKey("fixed-key")
                .payloadVersion("v1")
                .issuedAt(LocalDateTime.of(2026, 3, 12, 10, 0))
                .expiresAt(FIXED_NOW.plusDays(1))
                .status(BoothQrStatus.ACTIVE)
                .build();

        final BoothWaiting waiting = BoothWaiting.builder()
                .id(100L)
                .boothId(12L)
                .visitorId(21L)
                .status(WaitingStatus.CALLED)
                .waitingNumber(7)
                .deferCount(0)
                .requestedAt(LocalDateTime.of(2026, 3, 12, 9, 30))
                .calledAt(FIXED_NOW.minusMinutes(3))
                .callExpiresAt(FIXED_NOW.minusSeconds(1))
                .build();

        Mockito.when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        Mockito.when(valueOperations.setIfAbsent(
                Mockito.eq("qr:scan:lock:booth:12:visitor:21"),
                Mockito.eq("1"),
                Mockito.eq(Duration.ofSeconds(5L))
        )).thenReturn(true);
        Mockito.when(boothQrRepository.findByBoothIdAndPurposeAndQrKeyAndStatus(
                12L,
                QrPurpose.FRONT_QUEUE_ARRIVAL,
                "fixed-key",
                BoothQrStatus.ACTIVE
        )).thenReturn(Optional.of(boothQr));
        Mockito.when(boothWaitingRepository.findFirstByBoothIdAndVisitorIdAndStatusOrderByCalledAtDesc(
                12L,
                21L,
                WaitingStatus.CALLED
        )).thenReturn(Optional.of(waiting));
        Mockito.when(waitingStatusPersistenceService.expireWaiting(100L, FIXED_NOW.minusSeconds(1))).thenReturn(true);

        Assertions.assertThatThrownBy(() -> qrService.scanQr(
                        QrScanReqDto.builder()
                                .qrCode("FREELINE|FRONT_QUEUE_ARRIVAL|v1|12|fixed-key")
                                .build(),
                        21L))
                .isInstanceOf(QrException.class)
                .hasMessage("호출 유효 시간이 만료되었습니다.");

        Mockito.verify(waitingStatusPersistenceService).expireWaiting(100L, FIXED_NOW.minusSeconds(1));
        Mockito.verify(stringRedisTemplate).delete("qr:scan:lock:booth:12:visitor:21");
    }

    @Test
    void QR_스캔_실패_만료_반영이_skip되면_호출상태없음_예외를_반환한다() {
        final BoothQr boothQr = BoothQr.builder()
                .id(1L)
                .boothId(12L)
                .purpose(QrPurpose.FRONT_QUEUE_ARRIVAL)
                .qrKey("fixed-key")
                .payloadVersion("v1")
                .issuedAt(LocalDateTime.of(2026, 3, 12, 10, 0))
                .expiresAt(FIXED_NOW.plusDays(1))
                .status(BoothQrStatus.ACTIVE)
                .build();

        final BoothWaiting waiting = BoothWaiting.builder()
                .id(100L)
                .boothId(12L)
                .visitorId(21L)
                .status(WaitingStatus.CALLED)
                .waitingNumber(7)
                .deferCount(0)
                .requestedAt(LocalDateTime.of(2026, 3, 12, 9, 30))
                .calledAt(FIXED_NOW.minusMinutes(3))
                .callExpiresAt(FIXED_NOW.minusSeconds(1))
                .build();

        Mockito.when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        Mockito.when(valueOperations.setIfAbsent(
                Mockito.eq("qr:scan:lock:booth:12:visitor:21"),
                Mockito.eq("1"),
                Mockito.eq(Duration.ofSeconds(5L))
        )).thenReturn(true);
        Mockito.when(boothQrRepository.findByBoothIdAndPurposeAndQrKeyAndStatus(
                12L,
                QrPurpose.FRONT_QUEUE_ARRIVAL,
                "fixed-key",
                BoothQrStatus.ACTIVE
        )).thenReturn(Optional.of(boothQr));
        Mockito.when(boothWaitingRepository.findFirstByBoothIdAndVisitorIdAndStatusOrderByCalledAtDesc(
                12L,
                21L,
                WaitingStatus.CALLED
        )).thenReturn(Optional.of(waiting));
        Mockito.when(waitingStatusPersistenceService.expireWaiting(100L, FIXED_NOW.minusSeconds(1))).thenReturn(false);

        Assertions.assertThatThrownBy(() -> qrService.scanQr(
                        QrScanReqDto.builder()
                                .qrCode("FREELINE|FRONT_QUEUE_ARRIVAL|v1|12|fixed-key")
                                .build(),
                        21L))
                .isInstanceOf(QrException.class)
                .hasMessage("호출 상태의 대기를 찾을 수 없습니다.");

        Mockito.verify(waitingStatusPersistenceService).expireWaiting(100L, FIXED_NOW.minusSeconds(1));
        Mockito.verify(stringRedisTemplate).delete("qr:scan:lock:booth:12:visitor:21");
    }
}


