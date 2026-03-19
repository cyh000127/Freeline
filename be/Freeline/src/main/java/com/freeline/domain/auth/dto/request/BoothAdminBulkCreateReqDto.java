package com.freeline.domain.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

import lombok.Builder;

@Builder
public record BoothAdminBulkCreateReqDto(
        @NotNull(message = "행사 ID는 필수입니다.")
        Long eventId,

        @NotEmpty(message = "관리자 목록은 비어 있을 수 없습니다.")
        List<BoothAdminItem> admins
) {
    public record BoothAdminItem(
            @NotNull(message = "부스 ID는 필수입니다.")
            Long boothId,

            @NotBlank(message = "이메일은 필수입니다.")
            @Email(message = "유효한 이메일 형식이 아닙니다.")
            String email
    ) {}
}
