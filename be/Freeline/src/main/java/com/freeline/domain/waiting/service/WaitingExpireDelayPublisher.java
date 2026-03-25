package com.freeline.domain.waiting.service;

import java.time.Duration;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

import com.freeline.common.config.properties.RabbitMqWaitingProperties;
import com.freeline.domain.waiting.dto.message.WaitingExpireTaskMessage;

@Component
@RequiredArgsConstructor
public class WaitingExpireDelayPublisher {

    private final RabbitTemplate rabbitTemplate;
    private final RabbitMqWaitingProperties rabbitMqWaitingProperties;

    public void publish(final WaitingExpireTaskMessage message, final Duration delay) {
        if (delay.isNegative() || delay.isZero()) {
            return;
        }

        rabbitTemplate.convertAndSend(
                "",
                rabbitMqWaitingProperties.getExpireDelayQueue(),
                message,
                rabbitMessage -> {
                    rabbitMessage.getMessageProperties().setExpiration(String.valueOf(delay.toMillis()));
                    return rabbitMessage;
                }
        );
    }
}
