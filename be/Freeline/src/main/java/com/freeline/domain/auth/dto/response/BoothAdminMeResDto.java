package com.freeline.domain.auth.dto.response;

import java.time.LocalDateTime;

import lombok.Builder;

import com.freeline.domain.auth.entity.BoothAdminStatus;

@Builder
public record BoothAdminMeResDto(
        Long id,
        Long boothId,
        String boothName,
        String loginId,
        String email,
        String name,
        String company,
        BoothAdminStatus status,
        boolean isActive,
        LocalDateTime lastLoginAt
) {
}
