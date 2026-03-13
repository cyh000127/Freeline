package com.freeline.domain.waiting.dto.response;

import java.util.List;

import lombok.Builder;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record VisitorWaitingListResDto(

        @Schema(description = "관람객 대기 상태", example = "FREE")
        String visitorQueueStatus,

        @Schema(description = "활성 대기 목록")
        List<VisitorWaitingResDto> waitings
) {
}
