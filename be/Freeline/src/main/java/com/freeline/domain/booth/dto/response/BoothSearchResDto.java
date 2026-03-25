package com.freeline.domain.booth.dto.response;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;
import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.annotation.JsonNaming;

@Builder
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record BoothSearchResDto(
        @Schema(description = "부스 ID", example = "12")
        Long boothId,

        @Schema(description = "부스 이름(업체명)", example = "민음사")
        String boothName,

        @Schema(description = "관리자 이름", example = "김싸피")
        String adminName,

        @Schema(description = "소속(회사/기관명)", example = "민음사 출판그룹")
        String company
) {
}
