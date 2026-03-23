package com.freeline.domain.pushnotification.service;

import java.time.Duration;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

import com.freeline.common.config.properties.RabbitMqWaitingProperties;
import com.freeline.domain.pushnotification.dto.message.WaitingFcmTaskMessage;

@Component
@RequiredArgsConstructor
public class WaitingFcmDelayPublisher {

    private final RabbitTemplate rabbitTemplate;
    private final RabbitMqWaitingProperties rabbitMqWaitingProperties;

    public void publish(final WaitingFcmTaskMessage message, final Duration delay) {
        if (delay.isNegative() || delay.isZero()) {
            return;
        }

        rabbitTemplate.convertAndSend(
                "",
                rabbitMqWaitingProperties.getFcmDelayQueue(),
                message,
                rabbitMessage -> {
                    rabbitMessage.getMessageProperties().setExpiration(String.valueOf(delay.toMillis()));
                    return rabbitMessage;
                }
        );
    }
}
