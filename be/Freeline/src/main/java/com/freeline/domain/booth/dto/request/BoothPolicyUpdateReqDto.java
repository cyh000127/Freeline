package com.freeline.domain.booth.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
public record BoothPolicyUpdateReqDto(

        @Schema(description = "예상 체류 시간(초)", example = "600")
        @NotNull(message = "예상 체류 시간은 필수입니다.")
        @Positive(message = "예상 체류 시간은 0보다 커야 합니다.")
        Integer staySeconds,

        @Schema(description = "최대 대기 인원", example = "100")
        @NotNull(message = "최대 대기 인원은 필수입니다.")
        @Min(value = 0, message = "최대 대기 인원은 0 이상이어야 합니다.")
        Integer maxWaitingCount,

        @Schema(description = "한 번에 호출할 인원 수", example = "5")
        @NotNull(message = "호출 인원 수는 필수입니다.")
        @Min(value = 0, message = "호출 인원 수는 0 이상이어야 합니다.")
        Integer callCount,

        @Schema(description = "호출 유효 시간(초)", example = "180")
        @NotNull(message = "호출 유효 시간은 필수입니다.")
        @Min(value = 0, message = "호출 유효 시간은 0 이상이어야 합니다.")
        Integer callValidSeconds,

        @Schema(description = "미루기 최대 횟수", example = "2")
        @NotNull(message = "미루기 최대 횟수는 필수입니다.")
        @Min(value = 0, message = "미루기 최대 횟수는 0 이상이어야 합니다.")
        Integer deferLimit
) {
}
