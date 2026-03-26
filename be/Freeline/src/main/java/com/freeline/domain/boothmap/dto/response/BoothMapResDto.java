package com.freeline.domain.boothmap.dto.response;

import java.util.List;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
public record BoothMapResDto(

        @Schema(description = "행사 ID", example = "5")
        Long eventId,

        @Schema(description = "행사 지도 ID", example = "10")
        Long eventMapId,

        @Schema(description = "행사 지도 이미지 URL", example = "https://storage.example.com/map_v1.png")
        String mapImageUrl,

        @Schema(description = "부스 영역 목록")
        List<BoothMapAreaResDto> booths,

        @Schema(description = "AI 분석 임시 부스 영역 목록 (저장된 매핑이 없을 때 제공될 수 있음)")
        List<BoothAreaDraftDto> drafts
) {
}
