package com.freeline.domain.auth.dto;

public record BoothLoginReqDto(
        String loginId,
        String password
) {}
