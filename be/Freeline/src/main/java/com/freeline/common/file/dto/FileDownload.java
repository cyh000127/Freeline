package com.freeline.common.file.dto;

import lombok.Builder;

@Builder
public record FileDownload(
        byte[] content,
        String contentType,
        String fileName
) {
}
