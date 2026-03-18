package com.freeline.common.file.converter;

import org.springframework.web.multipart.MultipartFile;

import lombok.experimental.UtilityClass;

import com.freeline.common.file.dto.FileInfo;

@UtilityClass
public class FileConverter {

    public FileInfo toFileInfo(final MultipartFile file, final String fileUrl, final String objectKey) {
        return FileInfo.builder()
                .originalFilename(file.getOriginalFilename())
                .fileUrl(fileUrl)
                .objectKey(objectKey)
                .fileSize(file.getSize())
                .contentType(file.getContentType())
                .build();
    }
}
