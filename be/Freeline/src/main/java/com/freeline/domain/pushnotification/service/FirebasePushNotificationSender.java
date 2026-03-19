package com.freeline.domain.pushnotification.service;

import java.util.Map;

import lombok.RequiredArgsConstructor;

import com.freeline.common.error.ErrorCode;
import com.freeline.domain.pushnotification.exception.PushNotificationException;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;

@RequiredArgsConstructor
public class FirebasePushNotificationSender implements PushNotificationSender {

    private final FirebaseMessaging firebaseMessaging;

    @Override
    public boolean isActive() {
        return true;
    }

    @Override
    public void sendToToken(
            final String fcmToken,
            final String title,
            final String body,
            final Map<String, String> data
    ) {
        try {
            final Message message = Message.builder()
                    .setToken(fcmToken)
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build())
                    .putAllData(data)
                    .build();

            firebaseMessaging.send(message);
        } catch (final Exception exception) {
            throw new PushNotificationException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }
}
