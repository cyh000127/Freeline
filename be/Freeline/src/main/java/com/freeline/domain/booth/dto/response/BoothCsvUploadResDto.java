package com.freeline.domain.booth.dto.response;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
public record BoothCsvUploadResDto(

        @Schema(description = "행사 ID", example = "5")
        Long eventId,

        @Schema(description = "등록된 부스 수", example = "12")
        int importedCount,

        @Schema(description = "생성된 부스 관리자 계정 수", example = "12")
        int adminCreatedCount
) {
}
