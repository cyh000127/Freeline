package com.freeline.domain.report.service;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.freeline.domain.report.entity.BoothPerformanceResult;
import com.freeline.domain.report.entity.EventSummaryResult;
import com.freeline.domain.report.entity.HourlyTrafficResult;
import com.freeline.domain.report.entity.ProblemSpotResult;
import com.freeline.domain.report.entity.VisitorPathResult;
import com.freeline.domain.report.repository.BoothPerformanceResultRepository;
import com.freeline.domain.report.repository.EventSummaryResultRepository;
import com.freeline.domain.report.repository.HourlyTrafficResultRepository;
import com.freeline.domain.report.repository.ProblemSpotResultRepository;
import com.freeline.domain.report.repository.VisitorPathResultRepository;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportImportService {

    private final EventSummaryResultRepository eventSummaryResultRepository;
    private final BoothPerformanceResultRepository boothPerformanceResultRepository;
    private final HourlyTrafficResultRepository hourlyTrafficResultRepository;
    private final VisitorPathResultRepository visitorPathResultRepository;
    private final ProblemSpotResultRepository problemSpotResultRepository;

    @Value("${hdfs.hive-url}")
    private String hiveUrl;

    @Value("${hdfs.hive-user}")
    private String hiveUser;

    @Value("${hdfs.hive-password}")
    private String hivePassword;

    private static final String DRIVER_NAME = "org.apache.hive.jdbc.HiveDriver";

    @Transactional
    public void importEventReport(Long eventId) {
        log.info("Starting report import from Hive to PostgreSQL for event_id: {}", eventId);

        // 이전 적재 데이터 초기화 (재적재 방지)
        clearExistingReport(eventId);

        try {
            Class.forName(DRIVER_NAME);
        } catch (ClassNotFoundException e) {
            log.error("Hive JDBC Driver not found", e);
            throw new RuntimeException("Hive JDBC Driver not found", e);
        }

        try (Connection conn = DriverManager.getConnection(hiveUrl, hiveUser, hivePassword)) {
            importEventSummary(conn, eventId);
            importBoothPerformance(conn, eventId);
            importHourlyTraffic(conn, eventId);
            importVisitorPath(conn, eventId);
            importProblemSpots(conn, eventId);
            log.info("Successfully completed report import for event_id: {}", eventId);
        } catch (SQLException e) {
            log.error("Error during Hive connection or query execution", e);
            throw new RuntimeException("Hive import failed", e);
        }
    }

    private void clearExistingReport(Long eventId) {
        eventSummaryResultRepository.deleteByEventId(eventId);
        boothPerformanceResultRepository.deleteByEventId(eventId);
        hourlyTrafficResultRepository.deleteByEventId(eventId);
        visitorPathResultRepository.deleteByEventId(eventId);
        problemSpotResultRepository.deleteByEventId(eventId);
    }

    private void importEventSummary(Connection conn, Long eventId) throws SQLException {
        String sql = "SELECT event_id, total_visitors, total_registrations, "
                + "avg_waiting_seconds, overall_dropout_rate, peak_hour, analyzed_at "
                + "FROM freeline.event_summary_result WHERE event_id = ?";

        try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setLong(1, eventId);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    EventSummaryResult entity = EventSummaryResult.builder()
                            .eventId(rs.getLong("event_id"))
                            .totalVisitors(rs.getLong("total_visitors"))
                            .totalRegistrations(rs.getLong("total_registrations"))
                            .avgWaitingSeconds(getNullableDouble(rs, "avg_waiting_seconds"))
                            .overallDropoutRate(getNullableDouble(rs, "overall_dropout_rate"))
                            .peakHour(rs.getString("peak_hour"))
                            .analyzedAt(rs.getString("analyzed_at"))
                            .build();
                    eventSummaryResultRepository.save(entity);
                    log.info("Imported EventSummaryResult for event_id: {}", eventId);
                }
            }
        }
    }

    private void importBoothPerformance(Connection conn, Long eventId) throws SQLException {
        String sql = "SELECT event_id, booth_id, booth_name, view_count, register_count, dropout_count, conversion_rate, dropout_rate, analyzed_at " +
                "FROM freeline.booth_performance_result WHERE event_id = ?";
        List<BoothPerformanceResult> list = new ArrayList<>();

        try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setLong(1, eventId);
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    BoothPerformanceResult entity = BoothPerformanceResult.builder()
                            .eventId(rs.getLong("event_id"))
                            .boothId(rs.getLong("booth_id"))
                            .boothName(rs.getString("booth_name"))
                            .viewCount(rs.getLong("view_count"))
                            .registerCount(rs.getLong("register_count"))
                            .dropoutCount(rs.getLong("dropout_count"))
                            .conversionRate(rs.getDouble("conversion_rate"))
                            .dropoutRate(rs.getDouble("dropout_rate"))
                            .analyzedAt(rs.getString("analyzed_at"))
                            .build();
                    list.add(entity);
                }
            }
        }
        boothPerformanceResultRepository.saveAll(list);
        log.info("Imported {} BoothPerformanceResult records.", list.size());
    }

    private void importHourlyTraffic(Connection conn, Long eventId) throws SQLException {
        String sql = "SELECT event_id, datetime_hour, active_user_count, register_count, analyzed_at " +
                "FROM freeline.hourly_traffic_result WHERE event_id = ?";
        List<HourlyTrafficResult> list = new ArrayList<>();

        try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setLong(1, eventId);
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    HourlyTrafficResult entity = HourlyTrafficResult.builder()
                            .eventId(rs.getLong("event_id"))
                            .datetimeHour(rs.getString("datetime_hour"))
                            .activeUserCount(rs.getLong("active_user_count"))
                            .registerCount(rs.getLong("register_count"))
                            .analyzedAt(rs.getString("analyzed_at"))
                            .build();
                    list.add(entity);
                }
            }
        }
        hourlyTrafficResultRepository.saveAll(list);
        log.info("Imported {} HourlyTrafficResult records.", list.size());
    }

    private void importVisitorPath(Connection conn, Long eventId) throws SQLException {
        String sql = "SELECT event_id, path_string, visitor_count, analyzed_at " +
                "FROM freeline.visitor_path_result WHERE event_id = ?";
        List<VisitorPathResult> list = new ArrayList<>();

        try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setLong(1, eventId);
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    VisitorPathResult entity = VisitorPathResult.builder()
                            .eventId(rs.getLong("event_id"))
                            .pathString(rs.getString("path_string"))
                            .visitorCount(rs.getLong("visitor_count"))
                            .analyzedAt(rs.getString("analyzed_at"))
                            .build();
                    list.add(entity);
                }
            }
        }
        visitorPathResultRepository.saveAll(list);
        log.info("Imported {} VisitorPathResult records.", list.size());
    }

    private void importProblemSpots(Connection conn, Long eventId) throws SQLException {
        String sql = "SELECT event_id, issue_type, target_id, target_name, severity, issue_metric, description, analyzed_at " +
                "FROM freeline.problem_spots_result WHERE event_id = ?";
        List<ProblemSpotResult> list = new ArrayList<>();

        try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setLong(1, eventId);
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    ProblemSpotResult entity = ProblemSpotResult.builder()
                            .eventId(rs.getLong("event_id"))
                            .issueType(rs.getString("issue_type"))
                            .targetId(rs.getString("target_id"))
                            .targetName(rs.getString("target_name"))
                            .severity(rs.getString("severity"))
                            .issueMetric(rs.getDouble("issue_metric"))
                            .description(rs.getString("description"))
                            .analyzedAt(rs.getString("analyzed_at"))
                            .build();
                    list.add(entity);
                }
            }
        }
        problemSpotResultRepository.saveAll(list);
        log.info("Imported {} ProblemSpotResult records.", list.size());
    }

    private Double getNullableDouble(ResultSet rs, String columnName) throws SQLException {
        Object value = rs.getObject(columnName);
        if (value == null) {
            return null;
        }
        return rs.getDouble(columnName);
    }
}
