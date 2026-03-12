package com.freeline.domain.event.dto.response;

import lombok.Builder;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record BoothCongestionDto(

        @Schema(description = "원활 부스 수", example = "8")
        Integer smooth,

        @Schema(description = "보통 부스 수", example = "3")
        Integer normal,

        @Schema(description = "혼잡 부스 수", example = "1")
        Integer congested
) {
}
