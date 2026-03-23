package com.freeline.common.event.waiting.publisher;

import com.freeline.common.event.waiting.model.WaitingEventChannel;
import com.freeline.common.event.waiting.model.WaitingEventType;

public final class WaitingEventRoutingKeys {

    private static final String SSE_PREFIX = "waiting.sse.";
    private static final String FCM_PREFIX = "waiting.fcm.";

    private WaitingEventRoutingKeys() {
    }

    public static String toRoutingKey(final WaitingEventChannel channel, final WaitingEventType eventType) {
        final String eventSuffix = eventType.name()
                .replace("WAITING_", "")
                .toLowerCase();

        return switch (channel) {
            case SSE -> SSE_PREFIX + eventSuffix;
            case FCM -> FCM_PREFIX + eventSuffix;
        };
    }
}
