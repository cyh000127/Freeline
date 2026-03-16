package com.freeline.domain.auth.dto;

import lombok.Builder;

@Builder
public record LoginResDto(
        String accessToken,
        String refreshToken
) {}
