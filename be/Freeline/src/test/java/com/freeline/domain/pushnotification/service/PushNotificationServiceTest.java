package com.freeline.domain.pushnotification.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import com.freeline.domain.booth.entity.Booth;
import com.freeline.domain.booth.entity.BoothWaiting;
import com.freeline.domain.booth.entity.WaitingStatus;
import com.freeline.domain.booth.repository.BoothRepository;
import com.freeline.domain.booth.repository.BoothWaitingRepository;
import com.freeline.domain.booth.repository.VisitorRepository;
import com.freeline.domain.pushnotification.dto.request.FcmTokenUpsertReqDto;
import com.freeline.domain.pushnotification.dto.request.PushNotificationSendReqDto;
import com.freeline.domain.pushnotification.dto.response.FcmTokenResDto;
import com.freeline.domain.pushnotification.dto.response.PushNotificationSendResDto;
import com.freeline.domain.pushnotification.entity.FcmToken;
import com.freeline.domain.pushnotification.entity.NotificationPlatform;
import com.freeline.domain.pushnotification.entity.PushNotificationType;
import com.freeline.domain.pushnotification.exception.PushNotificationException;
import com.freeline.domain.pushnotification.repository.FcmTokenRepository;

@ExtendWith(MockitoExtension.class)
class PushNotificationServiceTest {

    @Mock
    private VisitorRepository visitorRepository;

    @Mock
    private BoothRepository boothRepository;

    @Mock
    private BoothWaitingRepository boothWaitingRepository;

    @Mock
    private FcmTokenRepository fcmTokenRepository;

    @Mock
    private PushNotificationSender pushNotificationSender;

    private PushNotificationService pushNotificationService;

    @BeforeEach
    void setUp() {
        pushNotificationService = new PushNotificationService(
                visitorRepository,
                boothRepository,
                boothWaitingRepository,
                fcmTokenRepository,
                pushNotificationSender
        );
    }

    @Test
    void FCM_토큰_저장_성공() {
        final FcmToken saved = FcmToken.builder()
                .id(1L)
                .visitorId(21L)
                .deviceId("android-1")
                .fcmToken("token-value")
                .platform(NotificationPlatform.ANDROID)
                .build();

        Mockito.when(visitorRepository.existsById(21L)).thenReturn(true);
        Mockito.when(fcmTokenRepository.findByDeviceId("android-1")).thenReturn(Optional.empty());
        Mockito.when(fcmTokenRepository.save(Mockito.any(FcmToken.class))).thenReturn(saved);

        final FcmTokenResDto result = pushNotificationService.upsertFcmToken(FcmTokenUpsertReqDto.builder()
                .visitorId(21L)
                .deviceId("android-1")
                .fcmToken("token-value")
                .platform(NotificationPlatform.ANDROID)
                .build());

        Assertions.assertThat(result.tokenId()).isEqualTo(1L);
        Assertions.assertThat(result.visitorId()).isEqualTo(21L);
        Assertions.assertThat(result.deviceId()).isEqualTo("android-1");
    }

    @Test
    void 푸시_알림_발송_성공() {
        final BoothWaiting waiting = BoothWaiting.builder()
                .id(2045L)
                .boothId(12L)
                .visitorId(21L)
                .status(WaitingStatus.CALLED)
                .waitingNumber(10)
                .deferCount(0)
                .requestedAt(LocalDateTime.of(2026, 3, 16, 12, 0))
                .calledAt(LocalDateTime.of(2026, 3, 16, 12, 5))
                .callExpiresAt(LocalDateTime.of(2026, 3, 16, 12, 10))
                .build();

        final Booth booth = Booth.builder()
                .id(12L)
                .eventId(3L)
                .name("A-03 부스")
                .locationCode("A-03")
                .emergencyClosed(false)
                .build();

        final FcmToken token = FcmToken.builder()
                .id(1L)
                .visitorId(21L)
                .deviceId("android-1")
                .fcmToken("token-value")
                .platform(NotificationPlatform.ANDROID)
                .build();

        Mockito.when(pushNotificationSender.isActive()).thenReturn(true);
        Mockito.when(boothWaitingRepository.findById(2045L)).thenReturn(Optional.of(waiting));
        Mockito.when(boothRepository.findById(12L)).thenReturn(Optional.of(booth));
        Mockito.when(fcmTokenRepository.findAllByVisitorIdOrderByIdAsc(21L)).thenReturn(List.of(token));

        final PushNotificationSendResDto result = pushNotificationService.sendNotification(
                2045L,
                PushNotificationSendReqDto.builder()
                        .notificationType(PushNotificationType.FRONT_QUEUE_CALLED)
                        .customMessage("")
                        .build()
        );

        Assertions.assertThat(result.waitingId()).isEqualTo(2045L);
        Assertions.assertThat(result.notificationType()).isEqualTo(PushNotificationType.FRONT_QUEUE_CALLED);
        Assertions.assertThat(result.targetCount()).isEqualTo(1);
        Mockito.verify(pushNotificationSender).sendToToken(
                Mockito.eq("token-value"),
                Mockito.eq("앞큐 호출"),
                Mockito.eq("A-03 부스로 와주세요."),
                Mockito.anyMap()
        );
    }

    @Test
    void 푸시_알림_발송_실패_상태_불일치() {
        final BoothWaiting waiting = BoothWaiting.builder()
                .id(2045L)
                .boothId(12L)
                .visitorId(21L)
                .status(WaitingStatus.WAITING)
                .waitingNumber(10)
                .deferCount(0)
                .requestedAt(LocalDateTime.of(2026, 3, 16, 12, 0))
                .build();

        final Booth booth = Booth.builder()
                .id(12L)
                .eventId(3L)
                .name("A-03 부스")
                .locationCode("A-03")
                .emergencyClosed(false)
                .build();

        final FcmToken token = FcmToken.builder()
                .id(1L)
                .visitorId(21L)
                .deviceId("android-1")
                .fcmToken("token-value")
                .platform(NotificationPlatform.ANDROID)
                .build();

        Mockito.when(pushNotificationSender.isActive()).thenReturn(true);
        Mockito.when(boothWaitingRepository.findById(2045L)).thenReturn(Optional.of(waiting));
        Mockito.when(boothRepository.findById(12L)).thenReturn(Optional.of(booth));
        Mockito.when(fcmTokenRepository.findAllByVisitorIdOrderByIdAsc(21L)).thenReturn(List.of(token));

        Assertions.assertThatThrownBy(() -> pushNotificationService.sendNotification(
                        2045L,
                        PushNotificationSendReqDto.builder()
                                .notificationType(PushNotificationType.FRONT_QUEUE_CALLED)
                                .customMessage("")
                                .build()
                ))
                .isInstanceOf(PushNotificationException.class)
                .hasMessage("현재 대기 상태에서는 해당 알림을 보낼 수 없습니다.");
    }
}
