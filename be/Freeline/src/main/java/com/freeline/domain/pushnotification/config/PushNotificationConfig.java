package com.freeline.domain.pushnotification.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import lombok.extern.slf4j.Slf4j;

import com.freeline.domain.pushnotification.service.FirebasePushNotificationSender;
import com.freeline.domain.pushnotification.service.NoOpPushNotificationSender;
import com.freeline.domain.pushnotification.service.PushNotificationSender;
import com.google.firebase.messaging.FirebaseMessaging;

@Slf4j
@Configuration
public class PushNotificationConfig {

    @Bean
    @ConditionalOnBean(FirebaseMessaging.class)
    // Firbase 주입이 성공했을 때
    public PushNotificationSender firebasePushNotificationSender(final FirebaseMessaging firebaseMessaging) {
        log.info("[PushNotification] Firebase push sender activated.");
        return new FirebasePushNotificationSender(firebaseMessaging);
    }

    @Bean
    @ConditionalOnMissingBean(PushNotificationSender.class)
    // Firebase 주입이 실패했을 때 (빌드는 안터짐)
    public PushNotificationSender noOpPushNotificationSender() {
        log.warn("[PushNotification] Firebase is not configured. Falling back to NoOp sender.");
        return new NoOpPushNotificationSender();
    }
}
