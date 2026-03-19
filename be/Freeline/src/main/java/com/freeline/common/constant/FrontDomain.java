package com.freeline.common.constant;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor(access = AccessLevel.PROTECTED)
public enum FrontDomain {

    LOCAL("http://localhost:5173", "프론트 로컬 도메인"),
    LIVE("https://j14a207.p.ssafy.io", "프론트 배포 도메인");

    private final String url;
    private final String description;
}
