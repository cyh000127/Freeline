package com.freeline.common.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "qr")
public record QrProperties(
        long boothActiveTtlDays,
        long reissueCooldownSeconds,
        long scanLockSeconds
) {
}