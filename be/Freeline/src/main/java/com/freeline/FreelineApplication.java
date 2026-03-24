package com.freeline;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@ConfigurationPropertiesScan
@EnableAsync
@EnableScheduling
@EnableJpaAuditing
@SpringBootApplication
@EnableConfigurationProperties
public class FreelineApplication {

    public static void main(String[] args) {
        SpringApplication.run(FreelineApplication.class, args);
    }

}
