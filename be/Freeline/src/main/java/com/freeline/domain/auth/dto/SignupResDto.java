package com.freeline.domain.auth.dto;

import lombok.Builder;

@Builder
public record SignupResDto(
        Long id,
        String email,
        String name
) {
}
