package com.freeline.common.file.validator;

import java.awt.image.BufferedImage;
import java.io.IOException;
import java.util.Set;

import javax.imageio.ImageIO;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import com.freeline.common.error.ErrorCode;
import com.freeline.common.error.exception.BusinessException;

@Component
public class MediaFileValidator {

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp"
    );

    public void validateFile(final MultipartFile file) {
        validateNotEmpty(file);
        validateContentType(file);
        validateFilename(file);
        validateImageIntegrity(file);
    }

    private void validateNotEmpty(final MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.FILE_EMPTY);
        }
    }

    private void validateContentType(final MultipartFile file) {
        final String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType)) {
            throw new BusinessException(ErrorCode.FILE_TYPE_NOT_ALLOWED);
        }
    }

    private void validateFilename(final MultipartFile file) {
        final String filename = file.getOriginalFilename();
        if (filename == null || filename.isBlank()
                || filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            throw new BusinessException(ErrorCode.FILE_NAME_INVALID);
        }
    }

    private void validateImageIntegrity(final MultipartFile file) {
        try {
            final BufferedImage image = ImageIO.read(file.getInputStream());
            if (image == null) {
                throw new BusinessException(ErrorCode.INVALID_IMAGE_FORMAT);
            }
        } catch (final IOException ex) {
            throw new BusinessException(ErrorCode.INVALID_IMAGE_FORMAT);
        }
    }
}
