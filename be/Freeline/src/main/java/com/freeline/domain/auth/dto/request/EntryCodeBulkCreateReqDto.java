package com.freeline.domain.auth.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import lombok.Builder;

@Builder
public record EntryCodeBulkCreateReqDto(
        @NotNull(message = "행사 ID는 필수입니다.")
        Long eventId,

        @NotNull(message = "생성 개수는 필수입니다.")
        @Min(value = 1, message = "생성 개수는 1 이상이어야 합니다.")
        @Max(value = 1000000, message = "생성 개수는 1_000_000 이하여야 합니다.")
        Integer quantity
) {
}
