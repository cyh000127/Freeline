package com.freeline.domain.pushnotification.entity;

import org.springframework.util.StringUtils;

public enum PushNotificationType {

    WAITING_EXPIRED("대기 만료", "호출 시간 안에 도착 확인이 없어 대기가 만료되었어요."),
    FRONT_QUEUE_CALLED("앞큐 호출", "%s 부스로 와주세요."),
    EXIT_ACTION_REQUIRED(
            "부스 이용 종료 안내",
            "아직 부스를 이용중이신가요? 아니라면 반드시 부스 퇴장 버튼을 눌러주세요! 다른 대기가 움직이지 않아요!"
    ),
    QR_CHECK_REMINDER("QR 도착 확인 안내", "혹시 도착하셨나요? 그럼 QR을 반드시 체크해주새요!!!");

    private final String defaultTitle;
    private final String defaultBodyTemplate;

    PushNotificationType(final String defaultTitle, final String defaultBodyTemplate) {
        this.defaultTitle = defaultTitle;
        this.defaultBodyTemplate = defaultBodyTemplate;
    }

    public String resolveTitle() {
        return defaultTitle;
    }

    public String resolveBody(final String boothName, final String customMessage) {
        if (StringUtils.hasText(customMessage)) {
            return customMessage;
        }

        if (this == FRONT_QUEUE_CALLED) {
            return defaultBodyTemplate.formatted(boothName);
        }

        return defaultBodyTemplate;
    }
}
