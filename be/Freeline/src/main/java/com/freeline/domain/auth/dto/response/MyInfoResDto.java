package com.freeline.domain.auth.dto.response;

import lombok.Builder;

@Builder
public record MyInfoResDto(
        Long id,
        String email,
        String name,
        String organization
) {
}
