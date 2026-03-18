package com.freeline.common.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import com.freeline.common.config.properties.QrProperties;

@Configuration
@EnableConfigurationProperties(QrProperties.class)
public class QrConfig {
}
