package com.freeline.common.config;

import org.aopalliance.aop.Advice;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Declarables;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.config.RetryInterceptorBuilder;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.retry.RejectAndDontRequeueRecoverer;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.freeline.common.config.properties.RabbitMqWaitingProperties;

@Configuration
@EnableConfigurationProperties(RabbitMqWaitingProperties.class)
public class RabbitMqConfig {

    @Bean
    public Declarables waitingRabbitMqDeclarables(final RabbitMqWaitingProperties properties) {
        final TopicExchange waitingExchange = new TopicExchange(properties.getExchange());
        final DirectExchange deadLetterExchange = new DirectExchange(properties.getDeadLetterExchange());

        final Queue sseQueue = QueueBuilder.durable(properties.getSseQueue())
                .deadLetterExchange(properties.getDeadLetterExchange())
                .deadLetterRoutingKey(properties.getSseDeadLetterQueue())
                .build();

        final Queue fcmQueue = QueueBuilder.durable(properties.getFcmQueue())
                .deadLetterExchange(properties.getDeadLetterExchange())
                .deadLetterRoutingKey(properties.getFcmDeadLetterQueue())
                .build();
        final Queue fcmDelayQueue = QueueBuilder.durable(properties.getFcmDelayQueue())
                .deadLetterExchange(properties.getExchange())
                .deadLetterRoutingKey(properties.getFcmDelayedRoutingKey())
                .build();
        final Queue fcmDelayedQueue = QueueBuilder.durable(properties.getFcmDelayedQueue())
                .deadLetterExchange(properties.getDeadLetterExchange())
                .deadLetterRoutingKey(properties.getFcmDeadLetterQueue())
                .build();
        final Queue expireDelayQueue = QueueBuilder.durable(properties.getExpireDelayQueue())
                .deadLetterExchange(properties.getExchange())
                .deadLetterRoutingKey(properties.getExpireDelayedRoutingKey())
                .build();
        final Queue expireDelayedQueue = QueueBuilder.durable(properties.getExpireDelayedQueue())
                .deadLetterExchange(properties.getDeadLetterExchange())
                .deadLetterRoutingKey(properties.getExpireDeadLetterQueue())
                .build();
        final Queue sseDeadLetterQueue = QueueBuilder.durable(properties.getSseDeadLetterQueue()).build();
        final Queue fcmDeadLetterQueue = QueueBuilder.durable(properties.getFcmDeadLetterQueue()).build();
        final Queue expireDeadLetterQueue = QueueBuilder.durable(properties.getExpireDeadLetterQueue()).build();

        final Binding sseBinding = BindingBuilder.bind(sseQueue)
                .to(waitingExchange)
                .with(properties.getSseRoutingKeyPattern());
        final Binding fcmBinding = BindingBuilder.bind(fcmQueue)
                .to(waitingExchange)
                .with(properties.getFcmRoutingKeyPattern());
        final Binding fcmDelayedBinding = BindingBuilder.bind(fcmDelayedQueue)
                .to(waitingExchange)
                .with(properties.getFcmDelayedRoutingKey());
        final Binding expireDelayedBinding = BindingBuilder.bind(expireDelayedQueue)
                .to(waitingExchange)
                .with(properties.getExpireDelayedRoutingKey());
        final Binding sseDeadLetterBinding = BindingBuilder.bind(sseDeadLetterQueue)
                .to(deadLetterExchange)
                .with(properties.getSseDeadLetterQueue());
        final Binding fcmDeadLetterBinding = BindingBuilder.bind(fcmDeadLetterQueue)
                .to(deadLetterExchange)
                .with(properties.getFcmDeadLetterQueue());
        final Binding expireDeadLetterBinding = BindingBuilder.bind(expireDeadLetterQueue)
                .to(deadLetterExchange)
                .with(properties.getExpireDeadLetterQueue());

        return new Declarables(
                waitingExchange,
                deadLetterExchange,
                sseQueue,
                fcmQueue,
                fcmDelayQueue,
                fcmDelayedQueue,
                expireDelayQueue,
                expireDelayedQueue,
                sseDeadLetterQueue,
                fcmDeadLetterQueue,
                expireDeadLetterQueue,
                sseBinding,
                fcmBinding,
                fcmDelayedBinding,
                expireDelayedBinding,
                sseDeadLetterBinding,
                fcmDeadLetterBinding,
                expireDeadLetterBinding
        );
    }

    @Bean
    public MessageConverter rabbitMqMessageConverter() {
        return new JacksonJsonMessageConverter();
    }

    @Bean
    public Advice waitingRabbitRetryInterceptor(final RabbitMqWaitingProperties properties) {
        return RetryInterceptorBuilder.stateless()
                .maxRetries(properties.getConsumerMaxAttempts())
                .recoverer(new RejectAndDontRequeueRecoverer("waiting consumer retries exhausted"))
                .build();
    }

    @Bean
    public SimpleRabbitListenerContainerFactory waitingRabbitListenerContainerFactory(
            final ConnectionFactory connectionFactory,
            final MessageConverter rabbitMqMessageConverter,
            final Advice waitingRabbitRetryInterceptor
    ) {
        final SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(rabbitMqMessageConverter);
        factory.setDefaultRequeueRejected(false);
        factory.setAdviceChain(waitingRabbitRetryInterceptor);
        return factory;
    }
}
