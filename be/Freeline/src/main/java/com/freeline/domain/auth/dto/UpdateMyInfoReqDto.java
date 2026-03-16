package com.freeline.domain.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateMyInfoReqDto(
        @NotBlank
        String name,

        @NotBlank
        String organization
) {}
