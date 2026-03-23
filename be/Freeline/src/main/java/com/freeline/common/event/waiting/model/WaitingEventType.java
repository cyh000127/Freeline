package com.freeline.common.event.waiting.model;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum WaitingEventType {
    WAITING_CREATED("대기 생성", false, false),
    WAITING_CALLED("앞큐 호출", true, true),
    WAITING_REGISTERED("도착 확인", true, false),
    WAITING_ENTERED("입장 완료", true, true),
    WAITING_EXITED("이용 종료", true, false),
    WAITING_EXPIRED("호출 만료", false, true),
    WAITING_CANCELED("대기 취소", false, false),
    WAITING_REORDERED("대기 순서 변경", false, false);

    private final String description;
    private final boolean sseTarget;
    private final boolean fcmTarget;
}
