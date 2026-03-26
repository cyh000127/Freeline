package com.freeline.domain.boothmap.dto.request;

import jakarta.validation.constraints.NotNull;

import lombok.Builder;

@Builder
public record MappingSnapshotUpdateReqDto(
        @NotNull(message = "eventMapId는 필수입니다.")
        Long eventMapId,

        @NotNull(message = "스냅샷 데이터는 필수입니다.")
        String mappingSnapshot
) {
}
