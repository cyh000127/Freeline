package com.freeline.common.file.dto;

import lombok.Builder;

@Builder
public record FileInfo(
        String originalFilename,
        String fileUrl,
        String objectKey,
        Long fileSize,
        String contentType
) {
}
