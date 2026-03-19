package com.freeline.domain.auth.dto.response;

import lombok.Builder;

@Builder
public record BoothAdminCreateResDto(
        Long id,
        Long boothId,
        String loginId,
        String rawPassword, // 이메일 발송을 위한 생성된 직후의 평문 비밀번호
        String email,
        String name
) {
}
