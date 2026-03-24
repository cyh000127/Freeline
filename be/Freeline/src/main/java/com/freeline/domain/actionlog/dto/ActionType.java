package com.freeline.domain.actionlog.dto;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public enum ActionType {

	PAGE_VIEW("페이지 조회"),
	BOOTH_VIEW("부스 상세 조회"),
	WAITING_REGISTER("대기열 등록"),
	WAITING_CANCEL("대기열 취소"),
	WAITING_COMPLETE("대기 완료 (호출 응답)"),
	GOODS_VIEW("상품 조회"),
	MAP_INTERACTION("지도 인터랙션"),
	APP_OPEN("앱 포그라운드 진입"),
	PUSH_CLICK("푸시 알림 클릭");

	private final String description;
}
