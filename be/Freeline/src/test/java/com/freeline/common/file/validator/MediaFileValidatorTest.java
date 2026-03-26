package com.freeline.common.file.validator;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

import javax.imageio.ImageIO;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import com.freeline.common.error.ErrorCode;
import com.freeline.common.error.exception.BusinessException;

class MediaFileValidatorTest {

    private final MediaFileValidator mediaFileValidator = new MediaFileValidator();

    @Test
    void validateFile_successWhenImageBytesAreValid() throws IOException {
        final BufferedImage image = new BufferedImage(2, 2, BufferedImage.TYPE_INT_RGB);
        final ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        ImageIO.write(image, "png", outputStream);

        final MockMultipartFile file = new MockMultipartFile(
                "file",
                "valid.png",
                "image/png",
                outputStream.toByteArray()
        );

        Assertions.assertThatCode(() -> mediaFileValidator.validateFile(file))
                .doesNotThrowAnyException();
    }

    @Test
    void validateFile_failWhenSpoofedImageIsUploaded() {
        final MockMultipartFile file = new MockMultipartFile(
                "file",
                "spoofed.png",
                "image/png",
                "not-an-image".getBytes(StandardCharsets.UTF_8)
        );

        Assertions.assertThatThrownBy(() -> mediaFileValidator.validateFile(file))
                .isInstanceOf(BusinessException.class)
                .satisfies(exception -> Assertions.assertThat(((BusinessException) exception).getErrorCode())
                        .isEqualTo(ErrorCode.INVALID_IMAGE_FORMAT));
    }
}
