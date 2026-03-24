package com.freeline.domain.auth.dto.request;

import jakarta.validation.constraints.NotBlank;

import io.swagger.v3.oas.annotations.media.Schema;

public record LoginReqDto(
        @Schema(description = "행사 주최자 이메일 또는 부스 관리자 아이디", example = "admin@test.com")
        @NotBlank(message = "아이디 또는 이메일은 필수입니다.")
        String id,

        @Schema(description = "비밀번호", example = "1234")
        @NotBlank(message = "비밀번호는 필수입니다.")
        String password
) {
}
