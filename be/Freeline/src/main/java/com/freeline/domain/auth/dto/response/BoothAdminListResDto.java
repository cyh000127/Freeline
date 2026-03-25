package com.freeline.domain.auth.dto.response;

import java.time.LocalDateTime;

import lombok.Builder;

@Builder
public record BoothAdminListResDto(
        Long adminId,
        Long boothId,
        String boothName,
        String loginId,
        String name,
        String email,
        String company,
        String status,
        LocalDateTime lastLoginAt
) {
}
