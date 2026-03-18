package com.freeline.domain.boothmanager.dto.response;

import java.time.LocalDateTime;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;
import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.annotation.JsonNaming;

@Builder
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record BoothManagerWaitingItemResDto(

        @Schema(description = "대기 ID", example = "2045")
        Long waitingId,

        @Schema(description = "대기 번호", example = "89")
        Integer waitingNumber,

        @Schema(description = "방문객 이름", example = "김싸피")
        String visitorName,

        @Schema(description = "대기 상태", example = "REGISTERED")
        String status,

        @Schema(description = "도착 확인 완료 여부", example = "true")
        boolean arrivalChecked,

        @Schema(description = "호출 시각", example = "2026-03-17T14:30:00", nullable = true)
        LocalDateTime calledAt,

        @Schema(description = "도착 확인 시각", example = "2026-03-17T14:31:00", nullable = true)
        LocalDateTime registeredAt,

        @Schema(description = "입장 시각", example = "2026-03-17T14:35:00", nullable = true)
        LocalDateTime enteredAt
) {
}
