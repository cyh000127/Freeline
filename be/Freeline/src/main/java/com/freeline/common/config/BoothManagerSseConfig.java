package com.freeline.common.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import com.freeline.common.config.properties.BoothManagerSseProperties;

@Configuration
@EnableConfigurationProperties(BoothManagerSseProperties.class)
public class BoothManagerSseConfig {
}
