package com.freeline.domain.booth.dto.response;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
public record BoothPolicyResDto(

        @Schema(description = "부스 ID", example = "12")
        Long boothId,

        @Schema(description = "예상 체류 시간(초)", example = "600")
        Integer staySeconds,

        @Schema(description = "최대 대기 인원", example = "100")
        Integer maxWaitingCount,

        @Schema(description = "한 번에 호출할 인원 수", example = "5")
        Integer callCount,

        @Schema(description = "호출 유효 시간(초)", example = "180")
        Integer callValidSeconds,

        @Schema(description = "미루기 최대 횟수", example = "2")
        Integer deferLimit
) {
}
