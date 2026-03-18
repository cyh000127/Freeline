package com.freeline.domain.boothmanager.service;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.freeline.common.config.properties.BoothManagerSseProperties;
import com.freeline.common.util.TimeUtils;
import com.freeline.domain.booth.entity.WaitingStatus;
import com.freeline.domain.boothmanager.converter.BoothManagerConverter;
import com.freeline.domain.boothmanager.dto.response.BoothManagerSseEventResDto;

import tools.jackson.databind.ObjectMapper;

@Slf4j
@Service
@RequiredArgsConstructor
public class BoothManagerSseService {

    private static final String SSE_CHANNEL_PREFIX = "booth-manager:sse:booth:";
    private final Map<Long, List<SseEmitter>> emittersByBoothId = new ConcurrentHashMap<>();
    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;
    private final BoothManagerSseProperties boothManagerSseProperties;
    private final TimeUtils timeUtils;

    public static String topic(final Long boothId) {
        return SSE_CHANNEL_PREFIX + boothId;
    }

    public static String topicPattern() {
        return SSE_CHANNEL_PREFIX + "*";
    }

    public SseEmitter subscribe(final Long boothId) {
        final SseEmitter emitter = new SseEmitter(boothManagerSseProperties.timeoutMillis());
        emittersByBoothId.computeIfAbsent(boothId, ignored -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(boothId, emitter));
        emitter.onTimeout(() -> removeEmitter(boothId, emitter));
        emitter.onError(ex -> removeEmitter(boothId, emitter));

        sendEvent(emitter, "CONNECTED", BoothManagerConverter.toConnectedEventResDto(boothId, timeUtils.nowDateTime()));
        return emitter;
    }

    public void publishQueueUpdated(
            final Long boothId,
            final Long waitingId,
            final WaitingStatus changedStatus
    ) {
        publish(boothId, "QUEUE_UPDATED", waitingId, changedStatus);
    }

    public void publish(
            final Long boothId,
            final String eventType,
            final Long waitingId,
            final WaitingStatus changedStatus
    ) {
        final BoothManagerSseEventResDto payload = BoothManagerConverter.toSseEventResDto(
                eventType,
                boothId,
                waitingId,
                changedStatus,
                timeUtils.nowDateTime()
        );
        publishToRedis(boothId, payload);
    }

    public void broadcastFromRedis(final BoothManagerSseEventResDto payload) {
        broadcast(payload.boothId(), payload.eventType(), payload);
    }

    private void broadcast(
            final Long boothId,
            final String eventName,
            final BoothManagerSseEventResDto payload
    ) {
        final List<SseEmitter> emitters = emittersByBoothId.get(boothId);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }

        emitters.forEach(emitter -> sendEvent(emitter, eventName, payload));
    }

    private void publishToRedis(
            final Long boothId,
            final BoothManagerSseEventResDto payload
    ) {
        try {
            stringRedisTemplate.convertAndSend(
                    topic(boothId),
                    objectMapper.writeValueAsString(payload)
            );
        } catch (final Exception ex) {
            log.error("[BoothManagerSSE] redis publish serialization failed {boothId: {}, eventType: {}}",
                    boothId,
                    payload.eventType(),
                    ex);
        }
    }

    private void sendEvent(
            final SseEmitter emitter,
            final String eventName,
            final BoothManagerSseEventResDto payload
    ) {
        try {
            emitter.send(SseEmitter.event()
                    .name(eventName)
                    .data(payload));
        } catch (final IOException ex) {
            log.warn("[BoothManagerSSE] emitter send failed {event: {}}", eventName, ex);
            emitter.completeWithError(ex);
        }
    }

    private void removeEmitter(final Long boothId, final SseEmitter emitter) {
        final List<SseEmitter> emitters = emittersByBoothId.get(boothId);
        if (emitters == null) {
            return;
        }

        emitters.remove(emitter);
        if (emitters.isEmpty()) {
            emittersByBoothId.remove(boothId);
        }
    }
}
