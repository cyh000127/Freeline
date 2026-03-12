package com.freeline.domain.event.dto.response;

import java.time.LocalDateTime;

import lombok.Builder;

import com.fasterxml.jackson.annotation.JsonFormat;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
public record EventResDto(

        @Schema(description = "행사 ID", example = "1")
        Long eventId,

        @Schema(description = "행사 상태", example = "DRAFT")
        String status,

        @Schema(description = "생성 일시")
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Seoul")
        LocalDateTime createdAt
) {
}
