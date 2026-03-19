package com.freeline.domain.auth.dto.request;

import jakarta.validation.constraints.NotBlank;

public record LoginReqDto(
        @NotBlank(message = "아이디 또는 이메일은 필수입니다.")
        String id,

        @NotBlank(message = "비밀번호는 필수입니다.")
        String password
) {
}
