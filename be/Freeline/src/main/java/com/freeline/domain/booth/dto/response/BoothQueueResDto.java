package com.freeline.domain.booth.dto.response;

import java.util.List;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
public record BoothQueueResDto(

        @Schema(description = "부스 ID", example = "12")
        Long boothId,

        @Schema(description = "뒷큐 인원 수", example = "57")
        long backQueueCount,

        @Schema(description = "앞큐 인원 수", example = "2")
        long frontQueueCount,

        @Schema(description = "앞큐 목록")
        List<BoothQueueEntryResDto> frontQueue,

        @Schema(description = "현재 호출된 사용자")
        BoothCalledUserResDto currentCalledUser
) {
}