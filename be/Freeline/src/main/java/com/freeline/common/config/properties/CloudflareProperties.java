package com.freeline.common.config.properties;

import jakarta.validation.constraints.NotBlank;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "cloudflare")
public record CloudflareProperties(
        @NotBlank(message = "Cloudflare R2 엔드포인트는 필수입니다")
        String endpoint,

        @NotBlank(message = "R2 버킷 이름은 필수입니다")
        String bucket,

        @NotBlank(message = "R2 액세스 키는 필수입니다")
        String accessKey,

        @NotBlank(message = "R2 시크릿 키는 필수입니다")
        String secretKey
) {
}
