package com.freeline.domain.booth.dto.response;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
public record BoothCalledUserResDto(

        @Schema(description = "대기 ID", example = "1001")
        Long waitingId,

        @Schema(description = "방문자 이름", example = "홍길동")
        String visitorName,

        @Schema(description = "대기 번호", example = "15")
        Integer waitingNumber
) {
}
