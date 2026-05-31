package com.freeline.domain.pushnotification.service;

import java.io.BufferedWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.mockito.Mockito;

import com.freeline.common.event.waiting.model.WaitingEventMessage;
import com.freeline.common.event.waiting.model.WaitingEventType;
import com.freeline.domain.booth.entity.BoothWaiting;
import com.freeline.domain.booth.entity.WaitingStatus;
import com.freeline.domain.booth.repository.BoothWaitingRepository;
import com.freeline.domain.pushnotification.dto.message.WaitingFcmTaskMessage;
import com.freeline.domain.pushnotification.dto.request.PushNotificationSendReqDto;
import com.freeline.domain.pushnotification.dto.response.PushNotificationSendResDto;
import com.freeline.domain.pushnotification.entity.PushNotificationType;
import com.freeline.domain.waiting.service.WaitingPolicyResolver;

@EnabledIfSystemProperty(named = "benchmark.rabbitmq-fcm-consumer", matches = "true")
class WaitingFcmConsumerBottleneckBenchmarkTest {

    private static final int DEFAULT_MESSAGE_COUNT = 120;
    private static final int DEFAULT_WORKER_COUNT = 1;
    private static final int DEFAULT_SEND_DELAY_MILLIS = 20;
    private static final int DEFAULT_WARM_UP_COUNT = 1;
    private static final int DEFAULT_ITERATION_COUNT = 3;
    private static final long WAITING_ID = 301L;
    private static final long BOOTH_ID = 12L;
    private static final long VISITOR_ID = 21L;
    private static final String SCENARIO = "fcm-consumer-external-api-delay";

    @Test
    void measureWaitingFcmConsumerDrainTime() throws Exception {
        final String stage = setting("benchmark.rabbitmq-fcm-consumer.stage", "stage-unknown");
        final int messageCount = intSetting("benchmark.rabbitmq-fcm-consumer.message-count", DEFAULT_MESSAGE_COUNT);
        final int workerCount = intSetting("benchmark.rabbitmq-fcm-consumer.worker-count", DEFAULT_WORKER_COUNT);
        final int sendDelayMillis = intSetting(
                "benchmark.rabbitmq-fcm-consumer.send-delay-ms",
                DEFAULT_SEND_DELAY_MILLIS
        );
        final int warmUpCount = intSetting("benchmark.rabbitmq-fcm-consumer.warm-up", DEFAULT_WARM_UP_COUNT);
        final int iterationCount = intSetting(
                "benchmark.rabbitmq-fcm-consumer.iterations",
                DEFAULT_ITERATION_COUNT
        );
        final Path output = Path.of(setting(
                "benchmark.rabbitmq-fcm-consumer.output",
                "build/measurements/rabbitmq-fcm-consumer/" + stage + ".csv"
        ));

        Files.createDirectories(output.getParent());

        for (int index = 0; index < warmUpCount; index++) {
            runOnce(messageCount, workerCount, sendDelayMillis);
        }

        try (BufferedWriter writer = Files.newBufferedWriter(output)) {
            writer.write("stage,iteration,scenario,message_count,worker_count,send_delay_ms,"
                    + "sent_count,drain_time_ms,throughput_per_sec,avg_consume_latency_ms,"
                    + "p95_consume_latency_ms,max_consume_latency_ms");
            writer.newLine();

            for (int iteration = 1; iteration <= iterationCount; iteration++) {
                final BenchmarkResult result = runOnce(messageCount, workerCount, sendDelayMillis);

                writer.write(String.format(
                        Locale.ROOT,
                        "%s,%d,%s,%d,%d,%d,%d,%.3f,%.3f,%.3f,%.3f,%.3f",
                        stage,
                        iteration,
                        SCENARIO,
                        messageCount,
                        workerCount,
                        sendDelayMillis,
                        result.sentCount(),
                        result.drainTimeMillis(),
                        result.throughputPerSecond(),
                        result.averageConsumeLatencyMillis(),
                        result.p95ConsumeLatencyMillis(),
                        result.maxConsumeLatencyMillis()
                ));
                writer.newLine();
            }
        }
    }

    private BenchmarkResult runOnce(
            final int messageCount,
            final int workerCount,
            final int sendDelayMillis
    ) throws Exception {
        final DelayedPushNotificationService pushNotificationService =
                new DelayedPushNotificationService(sendDelayMillis);
        final WaitingFcmEventConsumer consumer = new WaitingFcmEventConsumer(
                pushNotificationService,
                new NoOpWaitingFcmDelayPublisher(),
                boothWaitingRepository(),
                new WaitingPolicyResolver(null, null, null)
        );
        final ConcurrentLinkedQueue<WaitingEventMessage> queue = new ConcurrentLinkedQueue<>(messages(messageCount));
        final ConcurrentLinkedQueue<Double> latencies = new ConcurrentLinkedQueue<>();
        final ExecutorService executorService = Executors.newFixedThreadPool(workerCount);
        final List<Future<?>> futures = new ArrayList<>();
        final long startedAt = System.nanoTime();

        for (int index = 0; index < workerCount; index++) {
            futures.add(executorService.submit(() -> consumeUntilEmpty(queue, consumer, latencies)));
        }

        for (Future<?> future : futures) {
            future.get();
        }

        executorService.shutdown();
        executorService.awaitTermination(10, TimeUnit.SECONDS);

        final double drainTimeMillis = (System.nanoTime() - startedAt) / 1_000_000.0;
        return BenchmarkResult.from(
                pushNotificationService.sentCount(),
                drainTimeMillis,
                new ArrayList<>(latencies)
        );
    }

    private void consumeUntilEmpty(
            final ConcurrentLinkedQueue<WaitingEventMessage> queue,
            final WaitingFcmEventConsumer consumer,
            final ConcurrentLinkedQueue<Double> latencies
    ) {
        WaitingEventMessage message = queue.poll();
        while (message != null) {
            final long startedAt = System.nanoTime();
            consumer.consume(message);
            latencies.add((System.nanoTime() - startedAt) / 1_000_000.0);
            message = queue.poll();
        }
    }

    private BoothWaitingRepository boothWaitingRepository() {
        final BoothWaitingRepository repository = Mockito.mock(BoothWaitingRepository.class);
        final LocalDateTime now = LocalDateTime.now();
        final BoothWaiting waiting = BoothWaiting.builder()
                .id(WAITING_ID)
                .boothId(BOOTH_ID)
                .visitorId(VISITOR_ID)
                .status(WaitingStatus.CALLED)
                .calledAt(now)
                .callExpiresAt(now.plusMinutes(3))
                .build();

        Mockito.when(repository.findById(Mockito.anyLong())).thenReturn(Optional.of(waiting));
        return repository;
    }

    private List<WaitingEventMessage> messages(final int messageCount) {
        final List<WaitingEventMessage> messages = new ArrayList<>();
        for (int index = 1; index <= messageCount; index++) {
            messages.add(WaitingEventMessage.builder()
                    .schemaVersion(1)
                    .eventId(UUID.randomUUID())
                    .eventType(WaitingEventType.WAITING_CALLED)
                    .waitingId(WAITING_ID)
                    .boothId(BOOTH_ID)
                    .visitorId(VISITOR_ID)
                    .previousStatus(WaitingStatus.WAITING.name())
                    .currentStatus(WaitingStatus.CALLED.name())
                    .occurredAt(LocalDateTime.now())
                    .snapshot(null)
                    .build());
        }
        return messages;
    }

    private String setting(final String name, final String defaultValue) {
        return System.getProperty(name, defaultValue);
    }

    private int intSetting(final String name, final int defaultValue) {
        return Integer.parseInt(setting(name, String.valueOf(defaultValue)));
    }

    private static class DelayedPushNotificationService extends PushNotificationService {

        private final int delayMillis;
        private final AtomicInteger sentCount = new AtomicInteger();

        DelayedPushNotificationService(final int delayMillis) {
            super(null, null, null, null, null);
            this.delayMillis = delayMillis;
        }

        @Override
        public boolean isConfigured() {
            return true;
        }

        @Override
        public PushNotificationSendResDto sendNotification(
                final Long waitingId,
                final PushNotificationSendReqDto request
        ) {
            try {
                Thread.sleep(delayMillis);
            } catch (final InterruptedException exception) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException("benchmark interrupted", exception);
            }

            sentCount.incrementAndGet();
            return PushNotificationSendResDto.builder()
                    .waitingId(waitingId)
                    .visitorId(VISITOR_ID)
                    .boothId(BOOTH_ID)
                    .notificationType(request.notificationType())
                    .status(WaitingStatus.CALLED.name())
                    .calledAt(LocalDateTime.now())
                    .expiredAt(LocalDateTime.now().plusMinutes(3))
                    .targetCount(1)
                    .build();
        }

        int sentCount() {
            return sentCount.get();
        }
    }

    private static class NoOpWaitingFcmDelayPublisher extends WaitingFcmDelayPublisher {

        NoOpWaitingFcmDelayPublisher() {
            super(null, null);
        }

        @Override
        public void publish(final WaitingFcmTaskMessage message, final java.time.Duration delay) {
        }
    }

    private record BenchmarkResult(
            int sentCount,
            double drainTimeMillis,
            double throughputPerSecond,
            double averageConsumeLatencyMillis,
            double p95ConsumeLatencyMillis,
            double maxConsumeLatencyMillis
    ) {

        static BenchmarkResult from(
                final int sentCount,
                final double drainTimeMillis,
                final List<Double> latencies
        ) {
            latencies.sort(Comparator.naturalOrder());
            final double average = latencies.stream()
                    .mapToDouble(Double::doubleValue)
                    .average()
                    .orElse(0.0);
            final double p95 = percentile(latencies, 0.95);
            final double max = latencies.isEmpty() ? 0.0 : latencies.get(latencies.size() - 1);
            final double throughput = sentCount / (drainTimeMillis / 1_000.0);
            return new BenchmarkResult(sentCount, drainTimeMillis, throughput, average, p95, max);
        }

        private static double percentile(final List<Double> sortedValues, final double percentile) {
            if (sortedValues.isEmpty()) {
                return 0.0;
            }

            final int index = Math.min(
                    sortedValues.size() - 1,
                    (int) Math.ceil(sortedValues.size() * percentile) - 1
            );
            return sortedValues.get(index);
        }
    }
}
