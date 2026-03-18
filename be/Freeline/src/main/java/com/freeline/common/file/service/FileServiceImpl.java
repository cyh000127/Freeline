package com.freeline.common.file.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.freeline.common.file.converter.FileConverter;
import com.freeline.common.file.dto.FileInfo;
import com.freeline.common.file.util.CloudflareStorageUtil;
import com.freeline.common.file.validator.MediaFileValidator;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileServiceImpl implements FileService {

    private final CloudflareStorageUtil cloudflareStorageUtil;
    private final MediaFileValidator mediaFileValidator;

    @Override
    public List<FileInfo> uploadFiles(final List<MultipartFile> files, final String directory) {
        files.forEach(mediaFileValidator::validateFile);

        final List<FileInfo> uploadedFiles = files.stream()
                .map(file -> uploadSingleFile(file, directory))
                .toList();

        log.info("[MediaFile] 파일 업로드 완료 {directory: {}, count: {}}", directory, uploadedFiles.size());
        return uploadedFiles;
    }

    @Override
    public FileInfo uploadFile(final MultipartFile file, final String directory) {
        mediaFileValidator.validateFile(file);
        final FileInfo uploadedFile = uploadSingleFile(file, directory);

        log.info("[MediaFile] 파일 업로드 완료 {directory: {}, name: {}}", directory, uploadedFile.originalFilename());
        return uploadedFile;
    }

    private FileInfo uploadSingleFile(final MultipartFile file, final String directory) {
        final String fileUrl = cloudflareStorageUtil.uploadFile(file, directory);
        final String objectKey = cloudflareStorageUtil.extractObjectKey(fileUrl);
        return FileConverter.toFileInfo(file, fileUrl, objectKey);
    }
}
