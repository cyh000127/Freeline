package com.freeline.domain.auth.service;

import java.io.BufferedWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import com.freeline.common.config.properties.AuthProperties;
import com.freeline.common.security.JwtProvider;
import com.freeline.domain.auth.converter.AuthConverter;
import com.freeline.domain.auth.dto.request.EntryCodeBulkCreateReqDto;
import com.freeline.domain.auth.dto.response.EntryCodeBulkCreateResDto;
import com.freeline.domain.booth.repository.VisitorEntryCodeBatchRepository;

@ExtendWith(SpringExtension.class)
@Testcontainers(disabledWithoutDocker = true)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@EnabledIfSystemProperty(named = "benchmark.entry-code-bulk", matches = "true")
@ContextConfiguration(classes = {
        EntryCodeBulkCreateLatencyBenchmarkTest.BenchmarkConfig.class,
        AuthService.class,
        AuthConverter.class,
        VisitorEntryCodeBatchRepository.class
})
@TestPropertySource(properties = {
        "jwt.refresh-token-expiration=120000",
        "jwt.visitor-access-token-expiration=86400000"
})
class EntryCodeBulkCreateLatencyBenchmarkTest {

    private static final long EVENT_ADMIN_ID = 1L;
    private static final long EVENT_ID = 1L;
    private static final int DEFAULT_EXISTING_VISITOR_COUNT = 20_000;
    private static final int DEFAULT_CREATE_QUANTITY = 2_000;
    private static final int DEFAULT_WARM_UP_COUNT = 2;
    private static final int DEFAULT_ITERATION_COUNT = 10;
    private static final String SCENARIO = "existing-visitors-plus-bulk-create";

    @Container
    private static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>(
            DockerImageName.parse("postgres:16-alpine")
    );

    @Autowired
    private AuthService authService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private DriverManagerDataSource dataSource;

    @Test
    void measureEntryCodeBulkCreateLatency() throws IOException {
        new ResourceDatabasePopulator(new ClassPathResource("ddl.sql")).execute(dataSource);

        final String stage = setting("BENCHMARK_STAGE", "stage-unknown");
        final int existingVisitorCount = intSetting(
                "BENCHMARK_EXISTING_VISITOR_COUNT",
                DEFAULT_EXISTING_VISITOR_COUNT
        );
        final int createQuantity = intSetting("BENCHMARK_CREATE_QUANTITY", DEFAULT_CREATE_QUANTITY);
        final int warmUpCount = intSetting("BENCHMARK_WARM_UP", DEFAULT_WARM_UP_COUNT);
        final int iterationCount = intSetting("BENCHMARK_ITERATIONS", DEFAULT_ITERATION_COUNT);
        final Path output = benchmarkOutput(stage);

        Files.createDirectories(output.getParent());

        for (int index = 0; index < warmUpCount; index++) {
            seedScenario(existingVisitorCount);
            authService.createEntryCodesBulk(EVENT_ADMIN_ID, request(createQuantity));
        }

        try (BufferedWriter writer = Files.newBufferedWriter(output)) {
            writer.write("stage,iteration,scenario,existing_visitor_count,create_quantity,"
                    + "created_count,total_visitor_count,latency_ms");
            writer.newLine();

            for (int iteration = 1; iteration <= iterationCount; iteration++) {
                seedScenario(existingVisitorCount);
                entityManager.clear();

                final long startedAt = System.nanoTime();
                final EntryCodeBulkCreateResDto result = authService.createEntryCodesBulk(
                        EVENT_ADMIN_ID,
                        request(createQuantity)
                );
                final long elapsedNanos = System.nanoTime() - startedAt;
                final long totalVisitorCount = countVisitors();

                writer.write(String.format(
                        Locale.ROOT,
                        "%s,%d,%s,%d,%d,%d,%d,%.3f",
                        stage,
                        iteration,
                        SCENARIO,
                        existingVisitorCount,
                        createQuantity,
                        result.createdCount(),
                        totalVisitorCount,
                        elapsedNanos / 1_000_000.0
                ));
                writer.newLine();
            }
        }
    }

    private void seedScenario(final int existingVisitorCount) {
        jdbcTemplate.execute("""
                TRUNCATE TABLE
                    visitors,
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
                    'entry code bulk benchmark',
                    CURRENT_DATE,
                    CURRENT_DATE,
                    '09:00:00',
                    '23:00:00',
                    'Benchmark Hall',
                    'OPEN'
                )
                """);
        jdbcTemplate.update("""
                INSERT INTO visitors (event_id, entry_code, name, is_active)
                SELECT
                    1,
                    'E1-' || LPAD(series.sequence_number::text, 6, '0'),
                    NULL,
                    true
                FROM generate_series(1, ?) AS series(sequence_number)
                """, existingVisitorCount);
    }

    private long countVisitors() {
        final Long total = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM visitors WHERE event_id = ?",
                Long.class,
                EVENT_ID
        );
        return total == null ? 0 : total;
    }

    private EntryCodeBulkCreateReqDto request(final int createQuantity) {
        return EntryCodeBulkCreateReqDto.builder()
                .eventId(EVENT_ID)
                .quantity(createQuantity)
                .build();
    }

    private static Path benchmarkOutput(final String stage) {
        final String configuredPath = setting("BENCHMARK_OUTPUT", "");
        if (!configuredPath.isBlank()) {
            return Path.of(configuredPath);
        }

        final String configuredDirectory = setting("BENCHMARK_OUTPUT_DIR", "");
        if (!configuredDirectory.isBlank()) {
            return Path.of(configuredDirectory).resolve(stage + ".csv");
        }

        final Path workspaceRoot = Path.of(System.getProperty("user.dir"))
                .getParent()
                .getParent()
                .getParent();
        return workspaceRoot
                .resolve("portfolio")
                .resolve("Freeline")
                .resolve("measurements")
                .resolve("entry-code-bulk")
                .resolve(stage + ".csv");
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
    @EnableJpaAuditing
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

        @Bean
        AuthProperties authProperties() {
            return Mockito.mock(AuthProperties.class);
        }

        @Bean
        PasswordEncoder passwordEncoder() {
            return Mockito.mock(PasswordEncoder.class);
        }

        @Bean
        JwtProvider jwtProvider() {
            return Mockito.mock(JwtProvider.class);
        }

        @Bean
        StringRedisTemplate redisTemplate() {
            return Mockito.mock(StringRedisTemplate.class);
        }

        @Bean
        JavaMailSender javaMailSender() {
            return Mockito.mock(JavaMailSender.class);
        }
    }
}
