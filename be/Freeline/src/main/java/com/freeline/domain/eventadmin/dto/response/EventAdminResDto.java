package com.freeline.domain.eventadmin.dto.response;

import java.time.LocalDateTime;

import lombok.Builder;

import com.fasterxml.jackson.annotation.JsonFormat;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
public record EventAdminResDto(

        @Schema(description = "관리자 ID", example = "1")
        Long adminId,

        @Schema(description = "이메일", example = "admin@freeline.com")
        String email,

        @Schema(description = "관리자 이름", example = "최홍권")
        String name,

        @Schema(description = "생성 시각")
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Seoul")
        LocalDateTime createdAt
) {
}
