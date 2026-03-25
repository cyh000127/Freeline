package com.freeline.domain.boothmap.dto.response;

import java.util.List;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
public record EventMapUploadResDto(
        @Schema(description = "행사 지도 ID", example = "10")
        Long eventMapId,

        @Schema(description = "행사 ID", example = "5")
        Long eventId,

        @Schema(description = "행사 지도 이미지 URL", example = "https://pub-example.r2.dev/map/uuid.png")
        String imagePath,

        @Schema(description = "대표 지도 노출 여부", example = "true")
        boolean isVisible,

        @Schema(description = "AI가 추출한 임시 부스 영역 목록 (DB 미저장 상태)")
        List<BoothAreaDraftDto> drafts
) {
}
