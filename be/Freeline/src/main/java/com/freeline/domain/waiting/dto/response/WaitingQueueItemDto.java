package com.freeline.domain.waiting.dto.response;

import java.time.LocalDateTime;

import lombok.Builder;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record WaitingQueueItemDto(

        @Schema(description = "대기 ID", example = "301")
        Long waitingId,

        @Schema(description = "대기 번호", example = "14")
        Integer waitingNumber,

        @Schema(description = "방문객 이름", example = "홍길동")
        String visitorName,

        @Schema(description = "대기 상태", example = "CALLED")
        String status,

        @Schema(description = "미루기 횟수", example = "1", nullable = true)
        Integer deferCount,

        @Schema(description = "호출 시각", example = "2026-03-16T14:30:00", nullable = true)
        LocalDateTime calledAt
) {
}
