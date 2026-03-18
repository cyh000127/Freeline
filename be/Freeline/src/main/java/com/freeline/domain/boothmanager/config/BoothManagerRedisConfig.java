package com.freeline.domain.boothmanager.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;

import com.freeline.domain.boothmanager.service.BoothManagerRedisSubscriber;
import com.freeline.domain.boothmanager.service.BoothManagerSseService;

@Configuration
public class BoothManagerRedisConfig {

    @Bean
    public RedisMessageListenerContainer boothManagerRedisMessageListenerContainer(
            final RedisConnectionFactory redisConnectionFactory,
            final BoothManagerRedisSubscriber boothManagerRedisSubscriber
    ) {
        final RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(redisConnectionFactory);
        container.addMessageListener(
                boothManagerRedisSubscriber,
                new PatternTopic(BoothManagerSseService.topicPattern())
        );
        return container;
    }
}
