package com.freeline.domain.boothmanager.service;

import java.nio.charset.StandardCharsets;

import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.freeline.domain.boothmanager.dto.response.BoothManagerSseEventResDto;

import tools.jackson.databind.ObjectMapper;

@Slf4j
@Component
@RequiredArgsConstructor
public class BoothManagerRedisSubscriber implements MessageListener {

    private final ObjectMapper objectMapper;
    private final BoothManagerSseService boothManagerSseService;

    @Override
    public void onMessage(final Message message, final byte[] pattern) {
        try {
            final String payload = new String(message.getBody(), StandardCharsets.UTF_8);
            final BoothManagerSseEventResDto event = objectMapper.readValue(
                    payload,
                    BoothManagerSseEventResDto.class
            );
            boothManagerSseService.broadcastFromRedis(event);
        } catch (final Exception ex) {
            log.error("[BoothManagerSSE] redis subscribe message handling failed", ex);
        }
    }
}
