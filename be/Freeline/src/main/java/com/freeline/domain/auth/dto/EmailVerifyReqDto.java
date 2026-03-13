package com.freeline.domain.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import lombok.Getter;

@Getter
public class EmailVerifyReqDto {

    @Email
    @NotBlank
    private String email;

    @NotBlank
    private String code;
}
