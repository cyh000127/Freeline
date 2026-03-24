package com.freeline.domain.actionlog.dto.request;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
public record ActionLogBulkReqDto(

		@Schema(description = "행동 로그 목록 (최대 100건)")
		@NotEmpty(message = "로그 목록은 비어있을 수 없습니다.")
		@Size(max = 100, message = "한 번에 최대 100건까지 전송할 수 있습니다.")
		@Valid
		List<ActionLogReqDto> logs
) {
}
