package com.freeline.domain.booth.dto.response;

import java.time.LocalDateTime;

import lombok.Builder;

import com.fasterxml.jackson.annotation.JsonFormat;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
public record BoothQueueEntryResDto(

        @Schema(description = "대기 ID", example = "1001")
        Long waitingId,

        @Schema(description = "방문자 이름", example = "홍길동")
        String visitorName,

        @Schema(description = "대기 번호", example = "15")
        Integer waitingNumber,

        @Schema(description = "대기 상태", example = "CALLED")
        String status,

        @Schema(description = "호출 시각")
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss", timezone = "Asia/Seoul")
        LocalDateTime calledAt
) {
}
