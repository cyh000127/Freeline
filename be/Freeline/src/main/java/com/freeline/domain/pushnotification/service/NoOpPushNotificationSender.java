package com.freeline.domain.pushnotification.service;

import java.util.Map;

public class NoOpPushNotificationSender implements PushNotificationSender {

    @Override
    public boolean isActive() {
        return false;
    }

    @Override
    public void sendToToken(
            final String fcmToken,
            final String title,
            final String body,
            final Map<String, String> data
    ) {
    }
}
