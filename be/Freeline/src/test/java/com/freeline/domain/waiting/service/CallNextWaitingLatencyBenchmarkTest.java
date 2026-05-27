package com.freeline.domain.waiting.service;

import java.io.BufferedWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Locale;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import com.freeline.common.event.waiting.detector.WaitingStatusChangeDetector;
import com.freeline.common.event.waiting.dispatcher.WaitingEventDispatcher;
import com.freeline.domain.waiting.assembler.WaitingEventSnapshotAssembler;
import com.freeline.domain.waiting.dto.response.WaitingCallResDto;

@ExtendWith(SpringExtension.class)
@Testcontainers(disabledWithoutDocker = true)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@EnabledIfEnvironmentVariable(named = "BENCHMARK_CALL_NEXT", matches = "true")
@ContextConfiguration(classes = {
        CallNextWaitingLatencyBenchmarkTest.BenchmarkConfig.class,
        WaitingService.class,
        WaitingPolicyResolver.class,
        WaitingEventSnapshotAssembler.class,
        WaitingEventDispatcher.class,
        WaitingStatusChangeDetector.class
})
class CallNextWaitingLatencyBenchmarkTest {

    private static final long TARGET_BOOTH_ID = 1L;
    private static final int DEFAULT_TOTAL_WAITING_COUNT = 10_000;
    private static final int DEFAULT_FRONT_BLOCKED_COUNT = 1_000;
    private static final int DEFAULT_CALL_COUNT = 5;
    private static final int DEFAULT_WARM_UP_COUNT = 20;
    private static final int DEFAULT_ITERATION_COUNT = 500;
    private static final String SCENARIO = "front-blocked-candidates";

    @Container
    private static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>(
            DockerImageName.parse("postgres:16-alpine")
    );

    @Autowired
    private WaitingService waitingService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private DriverManagerDataSource dataSource;

    @BeforeEach
    void setUp() {
        final int totalWaitingCount = intSetting("BENCHMARK_TOTAL_WAITING_COUNT", DEFAULT_TOTAL_WAITING_COUNT);
        final int frontBlockedCount = intSetting("BENCHMARK_FRONT_BLOCKED_COUNT", DEFAULT_FRONT_BLOCKED_COUNT);
        final int callCount = intSetting("BENCHMARK_CALL_COUNT", DEFAULT_CALL_COUNT);

        new ResourceDatabasePopulator(new ClassPathResource("ddl.sql")).execute(dataSource);
        seedScenario(totalWaitingCount, frontBlockedCount, callCount);
    }

    @Test
    void measureCallNextWaitingLatency() throws IOException {
        final String stage = setting("BENCHMARK_STAGE", "stage-unknown");
        final int totalWaitingCount = intSetting("BENCHMARK_TOTAL_WAITING_COUNT", DEFAULT_TOTAL_WAITING_COUNT);
        final int frontBlockedCount = intSetting("BENCHMARK_FRONT_BLOCKED_COUNT", DEFAULT_FRONT_BLOCKED_COUNT);
        final int callCount = intSetting("BENCHMARK_CALL_COUNT", DEFAULT_CALL_COUNT);
        final int warmUpCount = intSetting("BENCHMARK_WARM_UP", DEFAULT_WARM_UP_COUNT);
        final int iterationCount = intSetting("BENCHMARK_ITERATIONS", DEFAULT_ITERATION_COUNT);
        final Path output = Path.of(
                setting(
                        "BENCHMARK_OUTPUT",
                        "build/measurements/call-next/" + stage + ".csv"
                )
        );

        Files.createDirectories(output.getParent());

        for (int index = 0; index < warmUpCount; index++) {
            final WaitingCallResDto result = waitingService.callNextWaiting(TARGET_BOOTH_ID);
            resetCalledWaitings(result.waitingIds());
        }

        try (BufferedWriter writer = Files.newBufferedWriter(output)) {
            writer.write("stage,iteration,scenario,total_waiting_count,front_blocked_count,call_count,"
                    + "selected_count,latency_ms");
            writer.newLine();

            for (int iteration = 1; iteration <= iterationCount; iteration++) {
                entityManager.clear();
                final long startedAt = System.nanoTime();
                final WaitingCallResDto result = waitingService.callNextWaiting(TARGET_BOOTH_ID);
                final long elapsedNanos = System.nanoTime() - startedAt;
                resetCalledWaitings(result.waitingIds());

                writer.write(String.format(
                        Locale.ROOT,
                        "%s,%d,%s,%d,%d,%d,%d,%.3f",
                        stage,
                        iteration,
                        SCENARIO,
                        totalWaitingCount,
                        frontBlockedCount,
                        callCount,
                        result.calledCount(),
                        elapsedNanos / 1_000_000.0
                ));
                writer.newLine();
            }
        }
    }

    private void seedScenario(
            final int totalWaitingCount,
            final int frontBlockedCount,
            final int callCount
    ) {
        jdbcTemplate.execute("""
                TRUNCATE TABLE
                    booth_waiting,
                    visitors,
                    booth_policies,
                    booths,
                    event_policies,
                    events,
                    event_admins
                RESTART IDENTITY CASCADE
                """);
        jdbcTemplate.update("""
                INSERT INTO event_admins (id, email, password, name, company, verified)
                VALUES (1, 'benchmark@example.com', 'password', 'Benchmark Admin', 'Freeline', true)
                """);
        jdbcTemplate.update("""
                INSERT INTO events (
                    id,
                    event_admin_id,
                    name,
                    description,
                    start_date,
                    end_date,
                    open_time,
                    close_time,
                    location_address,
                    status
                )
                VALUES (
                    1,
                    1,
                    'Benchmark Event',
                    'callNextWaiting benchmark',
                    CURRENT_DATE,
                    CURRENT_DATE,
                    '09:00:00',
                    '23:00:00',
                    'Benchmark Hall',
                    'OPEN'
                )
                """);
        jdbcTemplate.update("""
                INSERT INTO event_policies (
                    id,
                    event_id,
                    default_stay_sec,
                    default_max_waiting,
                    default_call_count,
                    default_call_ttl,
                    default_defer_limit
                )
                VALUES (1, 1, 600, 20000, ?, 180, 2)
                """, callCount);
        jdbcTemplate.update("""
                INSERT INTO booths (id, event_id, name, location_code, open_time, close_time, is_closed)
                VALUES
                    (1, 1, 'Target Booth', 'A-01', '09:00:00', '23:00:00', false),
                    (2, 1, 'Other Booth', 'B-01', '09:00:00', '23:00:00', false)
                """);
        jdbcTemplate.update("""
                INSERT INTO visitors (id, event_id, entry_code, name, is_active)
                SELECT
                    gs,
                    1,
                    'ENTRY-' || gs,
                    'Visitor ' || gs,
                    true
                FROM generate_series(1, ?) gs
                """, totalWaitingCount);
        jdbcTemplate.update("""
                INSERT INTO booth_waiting (
                    id,
                    booth_id,
                    visitor_id,
                    status,
                    waiting_number,
                    defer_count,
                    requested_at
                )
                SELECT
                    100000 + gs,
                    1,
                    gs,
                    'WAITING',
                    gs,
                    0,
                    CURRENT_TIMESTAMP
                FROM generate_series(1, ?) gs
                """, totalWaitingCount);
        jdbcTemplate.update("""
                INSERT INTO booth_waiting (
                    id,
                    booth_id,
                    visitor_id,
                    status,
                    waiting_number,
                    defer_count,
                    requested_at,
                    called_at,
                    registered_at,
                    entered_at
                )
                SELECT
                    200000 + gs,
                    2,
                    gs,
                    CASE
                        WHEN gs % 3 = 0 THEN 'ENTERED'
                        WHEN gs % 3 = 1 THEN 'CALLED'
                        ELSE 'REGISTERED'
                    END,
                    gs,
                    0,
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP,
                    CASE WHEN gs % 3 <> 1 THEN CURRENT_TIMESTAMP ELSE NULL END,
                    CASE WHEN gs % 3 = 0 THEN CURRENT_TIMESTAMP ELSE NULL END
                FROM generate_series(1, ?) gs
                """, frontBlockedCount);
    }

    private void resetCalledWaitings(final List<Long> waitingIds) {
        for (final Long waitingId : waitingIds) {
            jdbcTemplate.update("""
                    UPDATE booth_waiting
                    SET status = 'WAITING',
                        called_at = NULL,
                        call_expires_at = NULL,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                    """, waitingId);
        }
    }

    private static String setting(final String name, final String defaultValue) {
        final String propertyName = name.toLowerCase(Locale.ROOT).replace('_', '.');
        final String propertyValue = System.getProperty(propertyName);
        if (propertyValue != null && !propertyValue.isBlank()) {
            return propertyValue;
        }

        final String environmentValue = System.getenv(name);
        if (environmentValue != null && !environmentValue.isBlank()) {
            return environmentValue;
        }

        return defaultValue;
    }

    private static int intSetting(final String name, final int defaultValue) {
        return Integer.parseInt(setting(name, String.valueOf(defaultValue)));
    }

    @Configuration
    @EnableTransactionManagement
    @EnableJpaRepositories(basePackages = "com.freeline.domain")
    static class BenchmarkConfig {

        @Bean
        DriverManagerDataSource dataSource() {
            final DriverManagerDataSource dataSource = new DriverManagerDataSource();
            dataSource.setDriverClassName(POSTGRES.getDriverClassName());
            dataSource.setUrl(POSTGRES.getJdbcUrl());
            dataSource.setUsername(POSTGRES.getUsername());
            dataSource.setPassword(POSTGRES.getPassword());
            return dataSource;
        }

        @Bean
        LocalContainerEntityManagerFactoryBean entityManagerFactory(
                final DriverManagerDataSource dataSource
        ) {
            final LocalContainerEntityManagerFactoryBean factory = new LocalContainerEntityManagerFactoryBean();
            factory.setDataSource(dataSource);
            factory.setPackagesToScan("com.freeline");
            factory.setJpaVendorAdapter(new HibernateJpaVendorAdapter());
            factory.getJpaPropertyMap().put("hibernate.hbm2ddl.auto", "none");
            factory.getJpaPropertyMap().put("hibernate.jdbc.time_zone", "Asia/Seoul");
            return factory;
        }

        @Bean
        PlatformTransactionManager transactionManager(final EntityManagerFactory entityManagerFactory) {
            return new JpaTransactionManager(entityManagerFactory);
        }

        @Bean
        JdbcTemplate jdbcTemplate(final DriverManagerDataSource dataSource) {
            return new JdbcTemplate(dataSource);
        }
    }
}
