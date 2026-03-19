package com.freeline.domain.auth.dto.response;

import lombok.Builder;

@Builder
public record SignupResDto(
        Long id,
        String email,
        String name,
        String organization
) {
}
