package com.freeline.domain.booth.controller;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.multipart.MultipartFile;

class BoothControllerSecurityTest {

    @Test
    void uploadBoothsByCsv_행사관리자권한이필수다() throws NoSuchMethodException {
        final PreAuthorize preAuthorize = BoothController.class
                .getMethod("uploadBoothsByCsv", Long.class, MultipartFile.class)
                .getAnnotation(PreAuthorize.class);

        Assertions.assertThat(preAuthorize).isNotNull();
        Assertions.assertThat(preAuthorize.value()).isEqualTo("hasRole('EVENT_ADMIN')");
    }
}
