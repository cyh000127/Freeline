package com.freeline.domain.event.dto.response;

import java.time.LocalDateTime;

import lombok.Builder;

import com.fasterxml.jackson.annotation.JsonFormat;

import io.swagger.v3.oas.annotations.media.Schema;
import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.annotation.JsonNaming;

@Builder
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record EventPolicyResDto(

        @Schema(description = "정책 ID", example = "1")
        Long policyId,

        @Schema(description = "행사 ID", example = "10")
        Long eventId,

        @Schema(description = "수정 일시")
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Seoul")
        LocalDateTime updatedAt
) {
}
