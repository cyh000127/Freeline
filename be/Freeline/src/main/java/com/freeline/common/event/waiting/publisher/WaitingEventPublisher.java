package com.freeline.common.event.waiting.publisher;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.freeline.common.config.properties.RabbitMqWaitingProperties;
import com.freeline.common.event.waiting.model.WaitingEventChannel;
import com.freeline.common.event.waiting.model.WaitingEventMessage;

@Slf4j
@Component
@RequiredArgsConstructor
public class WaitingEventPublisher {

    private final RabbitTemplate rabbitTemplate;
    private final RabbitMqWaitingProperties rabbitMqWaitingProperties;

    public void publish(final WaitingEventChannel channel, final WaitingEventMessage message) {
        final String routingKey = WaitingEventRoutingKeys.toRoutingKey(channel, message.eventType());

        rabbitTemplate.convertAndSend(
                rabbitMqWaitingProperties.getExchange(),
                routingKey,
                message
        );

        log.info(
                "[RabbitMQ] waiting event publish complete {eventId: {}, eventType: {}, channel: {}, routingKey: {}}",
                message.eventId(),
                message.eventType(),
                channel,
                routingKey
        );
    }
}
