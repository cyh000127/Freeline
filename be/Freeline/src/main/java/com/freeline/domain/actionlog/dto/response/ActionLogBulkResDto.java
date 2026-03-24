package com.freeline.domain.actionlog.dto.response;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
public record ActionLogBulkResDto(

		@Schema(description = "수신된 로그 건수", example = "20")
		int receivedCount,

		@Schema(description = "유효하지 않아 누락된 로그 건수", example = "0")
		int droppedCount
) {
}
