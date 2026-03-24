package com.freeline.domain.auth.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "아이디 중복 확인 응답")
public record CheckIdResDto(
        @Schema(description = "사용 가능 여부", example = "true")
        boolean isAvailable
) {
}
