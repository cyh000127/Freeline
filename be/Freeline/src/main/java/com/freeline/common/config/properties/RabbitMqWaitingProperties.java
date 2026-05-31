package com.freeline.common.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.rabbitmq.waiting")
public class RabbitMqWaitingProperties {

    // fallback
    private String exchange = "waiting.events";
    private String sseQueue = "waiting.sse.queue";
    private String fcmQueue = "waiting.fcm.queue";
    private String deadLetterExchange = "waiting.events.dlx";
    private String sseDeadLetterQueue = "waiting.sse.dlq";
    private String fcmDeadLetterQueue = "waiting.fcm.dlq";
    private String fcmDelayQueue = "waiting.fcm.delay.queue";
    private String fcmDelayedQueue = "waiting.fcm.delayed.queue";
    private String expireDeadLetterQueue = "waiting.expire.dlq";
    private String expireDelayQueue = "waiting.expire.delay.queue";
    private String expireDelayedQueue = "waiting.expire.delayed.queue";
    private String sseRoutingKeyPattern = "waiting.sse.*";
    private String fcmRoutingKeyPattern = "waiting.fcm.*";
    private String fcmDelayedRoutingKey = "waiting.fcm.delayed";
    private String expireDelayedRoutingKey = "waiting.expire.delayed";
    private int consumerMaxAttempts = 3;
    private ConsumerTuning sseConsumer = new ConsumerTuning();
    private ConsumerTuning fcmConsumer = new ConsumerTuning();
    private ConsumerTuning delayedFcmConsumer = new ConsumerTuning();
    private ConsumerTuning expireConsumer = new ConsumerTuning();

    @Getter
    @Setter
    public static class ConsumerTuning {

        private Integer concurrentConsumers;
        private Integer maxConcurrentConsumers;
        private Integer prefetchCount;
    }
}
