package com.freeline.domain.actionlog.dto;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public enum TargetType {

	BOOTH("부스"),
	GOODS("상품"),
	PAGE("페이지"),
	MAP("지도"),
	NOTIFICATION("알림");

	private final String description;
}
