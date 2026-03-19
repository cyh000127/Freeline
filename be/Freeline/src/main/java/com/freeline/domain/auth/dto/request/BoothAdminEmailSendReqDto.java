package com.freeline.domain.auth.dto.request;

import java.util.List;

import jakarta.validation.constraints.NotEmpty;

import lombok.Builder;

@Builder
public record BoothAdminEmailSendReqDto(
        @NotEmpty(message = "발송 대상 관리자 ID 목록은 비어 있을 수 없습니다.")
        List<Long> boothAdminIds
) {
}
