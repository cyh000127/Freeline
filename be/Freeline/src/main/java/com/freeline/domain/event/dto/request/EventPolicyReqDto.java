package com.freeline.domain.event.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import lombok.Builder;

import com.fasterxml.jackson.annotation.JsonProperty;

import io.swagger.v3.oas.annotations.media.Schema;
import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.annotation.JsonNaming;

@Builder
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record EventPolicyReqDto(

        @JsonProperty("default_stay_sec")
        @Schema(description = "예상 체류 시간(초)", example = "300")
        @NotNull(message = "예상 체류 시간은 필수입니다.")
        @Positive(message = "예상 체류 시간은 0보다 커야 합니다.")
        Integer defaultStaySec,

        @JsonProperty("default_max_waiting")
        @Schema(description = "최대 대기 인원", example = "100")
        @NotNull(message = "최대 대기 인원은 필수입니다.")
        @Min(value = 0, message = "최대 대기 인원은 0 이상이어야 합니다.")
        Integer defaultMaxWaiting,

        @JsonProperty("default_call_count")
        @Schema(description = "호출 인원 수", example = "5")
        @NotNull(message = "호출 인원 수는 필수입니다.")
        @Min(value = 0, message = "호출 인원 수는 0 이상이어야 합니다.")
        Integer defaultCallCount,

        @JsonProperty("default_call_ttl")
        @Schema(description = "기본 호출 유효 시간(초)", example = "60")
        @NotNull(message = "기본 호출 유효 시간은 필수입니다.")
        @Min(value = 0, message = "기본 호출 유효 시간은 0 이상이어야 합니다.")
        Integer defaultCallTtl,

        @JsonProperty("default_defer_limit")
        @Schema(description = "기본 미루기 제한 횟수", example = "2")
        @NotNull(message = "기본 미루기 제한 횟수는 필수입니다.")
        @Min(value = 0, message = "기본 미루기 제한 횟수는 0 이상이어야 합니다.")
        Integer defaultDeferLimit
) {
}
