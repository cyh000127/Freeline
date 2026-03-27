package com.freeline.domain.booth.dto.response;

import java.util.List;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
public record BoothCsvUploadResDto(

        @Schema(description = "행사 ID", example = "5")
        Long eventId,

        @Schema(description = "등록된 부스 수", example = "12")
        int importedCount,

        @Schema(description = "생성된 부스 관리자 계정 수", example = "12")
        int adminCreatedCount,

        @Schema(description = "생성 직후 1회 노출되는 부스 관리자 계정 정보")
        List<CreatedBoothAdminCredentialResDto> createdAdmins
) {
}
