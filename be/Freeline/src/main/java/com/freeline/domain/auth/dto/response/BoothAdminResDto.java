package com.freeline.domain.auth.dto.response;

import lombok.Builder;

@Builder
public record BoothAdminResDto(
        Long id,
        Long boothId,
        String boothName,
        String loginId,
        String email,
        String name,
        boolean isEmailSent,
        boolean isAccountIssued, // 계정 발급 여부
        boolean isActive,        // 계정 활성화 여부 (최초 로그인 성공 시 true)
        boolean isProfileComplete // 정보 채움 여부 (name != null)
) {
}
