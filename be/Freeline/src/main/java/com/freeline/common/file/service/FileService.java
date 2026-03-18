package com.freeline.common.file.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.freeline.common.file.dto.FileInfo;

public interface FileService {

    List<FileInfo> uploadFiles(final List<MultipartFile> files, final String directory);

    FileInfo uploadFile(final MultipartFile file, final String directory);
}
