package com.freeline.common.constant;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor(access = AccessLevel.PROTECTED)
public enum BackDomain {

	LOCAL("http://localhost:8080", "백엔드 로컬 서버");
	// PROD("", "백엔드 운영 서버");

	private final String url;
	private final String description;
}
