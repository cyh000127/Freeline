package com.freeline.domain.auth.dto.request;

import jakarta.validation.constraints.NotBlank;

import lombok.Builder;

@Builder
public record BoothAdminInitialPasswordChangeReqDto(
        @NotBlank(message = "로그인 ID는 필수입니다.")
        String loginId,

        @NotBlank(message = "기존 비밀번호는 필수입니다.")
        String oldPassword,

        @NotBlank(message = "새 비밀번호는 필수입니다.")
        String newPassword
) {
}
