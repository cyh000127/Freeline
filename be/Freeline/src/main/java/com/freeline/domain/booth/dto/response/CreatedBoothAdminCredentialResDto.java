package com.freeline.domain.booth.dto.response;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
public record CreatedBoothAdminCredentialResDto(

        @Schema(description = "부스 관리자 ID", example = "10")
        Long adminId,

        @Schema(description = "부스 ID", example = "5")
        Long boothId,

        @Schema(description = "부스 이름", example = "A-01 부스")
        String boothName,

        @Schema(description = "로그인 ID", example = "event5_ab12cd34")
        String loginId,

        @Schema(description = "생성 직후 1회 노출되는 임시 비밀번호", example = "Abc12345")
        String rawPassword,

        @Schema(description = "부스 관리자 이메일", example = "booth@example.com")
        String email,

        @Schema(description = "부스 관리자 이름", example = "홍길동")
        String name,

        @Schema(description = "부스 관리자 소속", example = "Freeline")
        String company
) {
}
