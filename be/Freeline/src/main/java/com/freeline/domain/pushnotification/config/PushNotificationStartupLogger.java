package com.freeline.domain.pushnotification.config;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.freeline.domain.pushnotification.service.PushNotificationSender;

@Slf4j
@Component
@RequiredArgsConstructor
public class PushNotificationStartupLogger {

    private final PushNotificationSender pushNotificationSender;

    @EventListener(ApplicationReadyEvent.class)
    public void logStartupStatus() {
        if (pushNotificationSender.isActive()) {
            log.info(
                    "[PushNotification] Startup ready {active: true, sender: {}}",
                    pushNotificationSender.getClass().getSimpleName()
            );
            return;
        }

        log.warn(
                "[PushNotification] Startup ready {active: false, sender: {}}",
                pushNotificationSender.getClass().getSimpleName()
        );
    }
}
