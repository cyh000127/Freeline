package com.freeline.domain.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import lombok.Builder;

@Builder
public record BoothAdminCreateReqDto(
        @NotNull(message = "부스 ID는 필수입니다.")
        Long boothId,

        @NotBlank(message = "로그인 ID는 필수입니다.")
        String loginId,

        @NotBlank(message = "비밀번호는 필수입니다.")
        String password,

        @NotBlank(message = "관리자 이름은 필수입니다.")
        String name
) {
}
