package com.freeline.domain.event.dto.response;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;
import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.annotation.JsonNaming;

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
