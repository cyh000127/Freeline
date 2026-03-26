package com.freeline.common.constant;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor(access = AccessLevel.PROTECTED)
public enum FrontDomain {

    LOCAL1("http://localhost:3000", "프론트 로컬 도메인"),
    LOCAL2("http://localhost:3001", "프론트 로컬 도메인"),
    LOCAL3("http://localhost:8081", "프론트 로컬 도메인"),
    LIVE("https://j14a207.p.ssafy.io", "프론트 배포 도메인");

    private final String url;
    private final String description;
}
