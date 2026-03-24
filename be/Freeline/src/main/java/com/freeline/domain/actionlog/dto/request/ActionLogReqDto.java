package com.freeline.domain.actionlog.dto.request;

import java.time.LocalDateTime;
import java.util.Map;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import lombok.Builder;

import com.fasterxml.jackson.annotation.JsonFormat;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
public record ActionLogReqDto(

		@Schema(description = "행사 ID", example = "1")
		@NotNull(message = "행사 ID는 필수입니다.")
		Long eventId,

		@Schema(description = "행동 유형", example = "BOOTH_VIEW")
		@NotBlank(message = "행동 유형은 필수입니다.")
		String action,

		@Schema(description = "대상 유형", example = "BOOTH")
		String targetType,

		@Schema(description = "대상 ID", example = "42")
		String targetId,

		@Schema(description = "행동별 추가 정보", example = "{\"page_name\": \"home\"}")
		Map<String, Object> metadata,

		@Schema(description = "클라이언트 발생 시각", example = "2026-03-24 14:30:00")
		@NotNull(message = "클라이언트 발생 시각은 필수입니다.")
		@JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Seoul")
		LocalDateTime clientTimestamp,

		@Schema(description = "세션 ID", example = "sess_abc123def456")
		@NotBlank(message = "세션 ID는 필수입니다.")
		String sessionId
) {
}
