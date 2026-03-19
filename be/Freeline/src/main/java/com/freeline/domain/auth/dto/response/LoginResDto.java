package com.freeline.domain.auth.dto.response;

import lombok.Builder;

import com.freeline.domain.auth.entity.Role;

@Builder
public record LoginResDto(
        String accessToken,
        String refreshToken,
        Role role
) {
}
