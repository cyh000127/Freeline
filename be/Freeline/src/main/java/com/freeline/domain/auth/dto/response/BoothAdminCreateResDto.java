package com.freeline.domain.auth.dto.response;

import lombok.Builder;

@Builder
public record BoothAdminCreateResDto(
        Long id,
        String loginId,
        String name
) {
}
