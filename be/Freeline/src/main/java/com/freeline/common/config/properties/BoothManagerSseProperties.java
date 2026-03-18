package com.freeline.common.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "booth-manager.sse")
public record BoothManagerSseProperties(
        long timeoutMillis
) {
}
