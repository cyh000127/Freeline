package com.freeline.domain.auth.dto.request;

public record BoothLoginReqDto(
        String loginId,
        String password
) {
}
