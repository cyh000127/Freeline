package com.freeline.common.file.util;

import java.io.IOException;
import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.freeline.common.config.properties.CloudflareProperties;
import com.freeline.common.error.ErrorCode;
import com.freeline.common.error.exception.BusinessException;
import com.freeline.common.file.dto.FileDownload;

import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

@Slf4j
@Component
@RequiredArgsConstructor
public class CloudflareStorageUtil {

    private static final String DEFAULT_CONTENT_TYPE = "application/octet-stream";

    private final S3Client s3Client;
    private final CloudflareProperties cloudflareProperties;

    public String uploadFile(final MultipartFile file, final String directory) {
        final String key = buildObjectKey(directory, file.getOriginalFilename());

        try {
            final PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(cloudflareProperties.bucket())
                    .key(key)
                    .contentType(resolveContentType(file.getContentType()))
                    .contentLength(file.getSize())
                    .build();

            s3Client.putObject(request, RequestBody.fromBytes(file.getBytes()));
            final String fileUrl = buildPublicFileUrl(key);
            log.info("[CloudflareStorage] 파일 업로드 완료 {key: {}}", key);
            return fileUrl;
        } catch (final S3Exception | IOException ex) {
            log.error("[CloudflareStorage] 파일 업로드 실패 {key: {}}", key, ex);
            throw new BusinessException(ErrorCode.FILE_UPLOAD_FAILED);
        }
    }

    public FileDownload downloadFile(final String fileUrl) {
        final String objectKey = extractObjectKey(fileUrl);

        try {
            final GetObjectRequest request = GetObjectRequest.builder()
                    .bucket(cloudflareProperties.bucket())
                    .key(objectKey)
                    .build();

            final ResponseBytes<GetObjectResponse> objectBytes = s3Client.getObjectAsBytes(request);
            final GetObjectResponse response = objectBytes.response();

            return FileDownload.builder()
                    .content(objectBytes.asByteArray())
                    .contentType(resolveContentType(response.contentType()))
                    .fileName(extractFileName(objectKey))
                    .build();
        } catch (final RuntimeException ex) {
            log.error("[CloudflareStorage] 파일 조회 실패 {url: {}}", fileUrl, ex);
            throw new BusinessException(ErrorCode.FILE_DOWNLOAD_FAILED);
        }
    }

    public void deleteFile(final String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) {
            return;
        }

        final String objectKey = extractObjectKey(fileUrl);

        try {
            final DeleteObjectRequest request = DeleteObjectRequest.builder()
                    .bucket(cloudflareProperties.bucket())
                    .key(objectKey)
                    .build();

            s3Client.deleteObject(request);
            log.info("[CloudflareStorage] 파일 삭제 완료 {key: {}}", objectKey);
        } catch (final RuntimeException ex) {
            log.error("[CloudflareStorage] 파일 삭제 실패 {url: {}}", fileUrl, ex);
            throw new BusinessException(ErrorCode.FILE_DELETE_FAILED);
        }
    }

    public String extractObjectKey(final String fileUrl) {
        final String outerPrefix = normalizeOuterPrefix(cloudflareProperties.outerPrefix());
        if (fileUrl == null || fileUrl.isBlank()) {
            throw new BusinessException(ErrorCode.FILE_NAME_INVALID);
        }

        if (fileUrl.startsWith(outerPrefix)) {
            return fileUrl.substring(outerPrefix.length());
        }

        final String endpointPrefix = normalizeOuterPrefix(
                String.format("%s/%s", cloudflareProperties.endpoint(), cloudflareProperties.bucket())
        );
        if (fileUrl.startsWith(endpointPrefix)) {
            return fileUrl.substring(endpointPrefix.length());
        }

        return fileUrl;
    }

    private String buildObjectKey(final String directory, final String originalFilename) {
        final String extension = extractExtension(originalFilename);
        return directory + "/" + UUID.randomUUID() + extension;
    }

    private String buildPublicFileUrl(final String objectKey) {
        return normalizeOuterPrefix(cloudflareProperties.outerPrefix()) + objectKey;
    }

    private String normalizeOuterPrefix(final String outerPrefix) {
        if (outerPrefix == null || outerPrefix.isBlank()) {
            return "";
        }

        if (outerPrefix.endsWith("/")) {
            return outerPrefix;
        }

        return outerPrefix + "/";
    }

    private String extractExtension(final String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.'));
    }

    private String extractFileName(final String objectKey) {
        if (objectKey == null || !objectKey.contains("/")) {
            return objectKey;
        }
        return objectKey.substring(objectKey.lastIndexOf('/') + 1);
    }

    private String resolveContentType(final String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return DEFAULT_CONTENT_TYPE;
        }
        return contentType;
    }
}
