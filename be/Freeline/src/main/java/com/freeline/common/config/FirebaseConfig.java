package com.freeline.common.config;

import com.freeline.common.config.properties.FirebaseProperties;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Base64;

@Slf4j
@Configuration
@EnableConfigurationProperties(FirebaseProperties.class)
public class FirebaseConfig {

    @Bean
    @ConditionalOnProperty(prefix = "firebase", name = "service-account-base64")
    public FirebaseApp firebaseApp(final FirebaseProperties firebaseProperties) throws IOException {
        log.info(
                "[Firebase] Initialization started. projectId={}",
                firebaseProperties.projectId()
        );

        byte[] decodedKey = Base64.getDecoder().decode(firebaseProperties.serviceAccountBase64());

        try (ByteArrayInputStream serviceAccount = new ByteArrayInputStream(decodedKey)) {
            final FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .setProjectId(firebaseProperties.projectId())
                    .build();

            if (FirebaseApp.getApps().isEmpty()) {
                final FirebaseApp firebaseApp = FirebaseApp.initializeApp(options);
                log.info("[Firebase] FirebaseApp initialized successfully. appName={}", firebaseApp.getName());
                return firebaseApp;
            }

            final FirebaseApp firebaseApp = FirebaseApp.getInstance();
            log.info("[Firebase] Reusing existing FirebaseApp. appName={}", firebaseApp.getName());
            return firebaseApp;
        } catch (final IOException exception) {
            log.error(
                    "[Firebase] Failed to initialize Firebase. projectId={}",
                    firebaseProperties.projectId(),
                    exception
            );
            throw exception;
        }
    }

    @Bean
    @ConditionalOnBean(FirebaseApp.class)
    public FirebaseMessaging firebaseMessaging(final FirebaseApp firebaseApp) {
        log.info("[Firebase] FirebaseMessaging bean created. appName={}", firebaseApp.getName());
        return FirebaseMessaging.getInstance(firebaseApp);
    }
}
