package com.freeline.common.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "cloudflare")
public record CloudflareProperties(
        String endpoint,
        String bucket,
        String accessKey,
        String secretKey,
        String outerPrefix
) {
}