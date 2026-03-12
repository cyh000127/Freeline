package com.freeline.common.file.controller;

import jakarta.validation.constraints.NotBlank;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;

import com.freeline.common.file.dto.FileInfo;
import com.freeline.common.file.service.FileService;
import com.freeline.common.response.BaseResponse;
import com.freeline.common.util.ResponseUtils;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@Validated
@Tag(name = "File", description = "공통 파일 업로드 API")
@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    @Operation(summary = "단일 파일 업로드", description = "파일 하나를 업로드하고 파일 정보를 반환합니다.")
    @PostMapping(value = "/{directory}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BaseResponse<FileInfo>> uploadFile(
            @PathVariable @NotBlank final String directory,
            @RequestPart("file") final MultipartFile file
    ) {
        final FileInfo response = fileService.uploadFile(file, directory);
        return ResponseUtils.ok(response);
    }
}