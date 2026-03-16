package com.freeline.domain.pushnotification.service;

import java.util.Map;

public interface PushNotificationSender {

    boolean isActive();

    void sendToToken(
            final String fcmToken,
            final String title,
            final String body,
            final Map<String, String> data
    );
}
