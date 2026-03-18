package com.freeline.domain.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record EmailVerifyReqDto(
        @Email
        @NotBlank
        String email,

        @NotBlank
        String code
) {
}
