package com.freeline.domain.report.service;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class HiveAnalysisService {

    private static final String DRIVER_NAME = "org.apache.hive.jdbc.HiveDriver";

    @Value("${hdfs.hive-url}")
    private String hiveUrl;

    @Value("${hdfs.hive-user}")
    private String hiveUser;

    @Value("${hdfs.hive-password}")
    private String hivePassword;

    public void runAnalysis(Long eventId) {
        log.info("Starting Hive analysis for event_id: {}", eventId);

        try {
            Class.forName(DRIVER_NAME);
        } catch (ClassNotFoundException e) {
            throw new RuntimeException("Hive JDBC Driver not found", e);
        }

        try (Connection conn = DriverManager.getConnection(hiveUrl, hiveUser, hivePassword);
             Statement stmt = conn.createStatement()) {

            analyzeBoothPerformance(stmt, eventId);
            analyzeHourlyTraffic(stmt, eventId);
            analyzeVisitorPaths(stmt, eventId);
            analyzeProblemSpots(stmt, eventId);
            analyzeEventSummary(stmt, eventId);

            log.info("Hive analysis completed for event_id: {}", eventId);
        } catch (SQLException e) {
            log.error("Hive analysis failed for event_id: {}", eventId, e);
            throw new RuntimeException("Hive analysis failed", e);
        }
    }

    private void analyzeBoothPerformance(Statement stmt, Long eventId) throws SQLException {
        String sql = "INSERT OVERWRITE TABLE freeline.booth_performance_result "
                + "SELECT "
                + "  b.event_id, "
                + "  b.booth_id, "
                + "  b.booth_name, "
                + "  COALESCE(v.view_count, 0), "
                + "  COALESCE(w.register_count, 0), "
                + "  COALESCE(w.dropout_count, 0), "
                + "  CASE WHEN COALESCE(v.view_count, 0) > 0 "
                + "    THEN ROUND(COALESCE(w.register_count, 0) / v.view_count, 4) "
                + "    ELSE 0.0 END, "
                + "  CASE WHEN COALESCE(w.register_count, 0) > 0 "
                + "    THEN ROUND(COALESCE(w.dropout_count, 0) / w.register_count, 4) "
                + "    ELSE 0.0 END, "
                + "  FROM_UNIXTIME(UNIX_TIMESTAMP()) "
                + "FROM freeline.booths b "
                + "LEFT JOIN ("
                + "  SELECT target_id, COUNT(*) AS view_count "
                + "  FROM freeline.action_logs "
                + "  WHERE event_id = " + eventId + " AND action = 'booth_view' "
                + "  GROUP BY target_id"
                + ") v ON CAST(b.booth_id AS STRING) = v.target_id "
                + "LEFT JOIN ("
                + "  SELECT target_id, "
                + "    SUM(CASE WHEN action = 'waiting_register' THEN 1 ELSE 0 END) AS register_count, "
                + "    SUM(CASE WHEN action = 'waiting_cancel' THEN 1 ELSE 0 END) AS dropout_count "
                + "  FROM freeline.action_logs "
                + "  WHERE event_id = " + eventId
                + "    AND action IN ('waiting_register', 'waiting_cancel') "
                + "  GROUP BY target_id"
                + ") w ON CAST(b.booth_id AS STRING) = w.target_id "
                + "WHERE b.event_id = " + eventId;

        stmt.execute(sql);
        log.info("Booth performance analysis completed for event_id: {}", eventId);
    }

    private void analyzeHourlyTraffic(Statement stmt, Long eventId) throws SQLException {
        String sql = "INSERT OVERWRITE TABLE freeline.hourly_traffic_result "
                + "SELECT "
                + "  " + eventId + ", "
                + "  SUBSTR(client_timestamp, 1, 13), "
                + "  COUNT(DISTINCT visitor_id), "
                + "  SUM(CASE WHEN action = 'waiting_register' THEN 1 ELSE 0 END), "
                + "  FROM_UNIXTIME(UNIX_TIMESTAMP()) "
                + "FROM freeline.action_logs "
                + "WHERE event_id = " + eventId + " "
                + "GROUP BY SUBSTR(client_timestamp, 1, 13)";

        stmt.execute(sql);
        log.info("Hourly traffic analysis completed for event_id: {}", eventId);
    }

    private void analyzeVisitorPaths(Statement stmt, Long eventId) throws SQLException {
        String sql = "INSERT OVERWRITE TABLE freeline.visitor_path_result "
                + "SELECT "
                + "  " + eventId + ", "
                + "  path_string, "
                + "  COUNT(*) AS visitor_count, "
                + "  FROM_UNIXTIME(UNIX_TIMESTAMP()) "
                + "FROM ("
                + "  SELECT visitor_id, "
                + "    CONCAT_WS(' -> ', COLLECT_LIST(target_id)) AS path_string "
                + "  FROM ("
                + "    SELECT visitor_id, target_id, client_timestamp "
                + "    FROM freeline.action_logs "
                + "    WHERE event_id = " + eventId + " AND action = 'booth_view' "
                + "    ORDER BY visitor_id, client_timestamp"
                + "  ) ordered_visits "
                + "  GROUP BY visitor_id"
                + ") visitor_paths "
                + "GROUP BY path_string "
                + "ORDER BY visitor_count DESC "
                + "LIMIT 50";

        stmt.execute(sql);
        log.info("Visitor path analysis completed for event_id: {}", eventId);
    }

    private void analyzeProblemSpots(Statement stmt, Long eventId) throws SQLException {
        String sql = "INSERT OVERWRITE TABLE freeline.problem_spots_result "
                + "SELECT "
                + "  " + eventId + ", "
                + "  'HIGH_DROPOUT', "
                + "  CAST(b.booth_id AS STRING), "
                + "  b.booth_name, "
                + "  CASE "
                + "    WHEN (w.dropout_count / w.total_count) >= avg_stats.avg_dropout * 3 THEN 'CRITICAL' "
                + "    WHEN (w.dropout_count / w.total_count) >= avg_stats.avg_dropout * 2 THEN 'HIGH' "
                + "    ELSE 'MEDIUM' END, "
                + "  ROUND(w.dropout_count / w.total_count, 4), "
                + "  CONCAT(b.booth_name, ': dropout rate ', "
                + "    ROUND(w.dropout_count / w.total_count * 100, 1), '%'), "
                + "  FROM_UNIXTIME(UNIX_TIMESTAMP()) "
                + "FROM freeline.booths b "
                + "JOIN ("
                + "  SELECT target_id, "
                + "    SUM(CASE WHEN action = 'waiting_cancel' THEN 1 ELSE 0 END) AS dropout_count, "
                + "    COUNT(*) AS total_count "
                + "  FROM freeline.action_logs "
                + "  WHERE event_id = " + eventId
                + "    AND action IN ('waiting_register', 'waiting_cancel') "
                + "  GROUP BY target_id "
                + "  HAVING COUNT(*) > 0"
                + ") w ON CAST(b.booth_id AS STRING) = w.target_id "
                + "CROSS JOIN ("
                + "  SELECT AVG(dropout_rate) AS avg_dropout FROM ("
                + "    SELECT target_id, "
                + "      SUM(CASE WHEN action = 'waiting_cancel' THEN 1 ELSE 0 END) / COUNT(*) AS dropout_rate "
                + "    FROM freeline.action_logs "
                + "    WHERE event_id = " + eventId
                + "      AND action IN ('waiting_register', 'waiting_cancel') "
                + "    GROUP BY target_id "
                + "    HAVING COUNT(*) > 0"
                + "  ) rates"
                + ") avg_stats "
                + "WHERE b.event_id = " + eventId
                + "  AND (w.dropout_count / w.total_count) >= avg_stats.avg_dropout * 2";

        stmt.execute(sql);
        log.info("Problem spots analysis completed for event_id: {}", eventId);
    }

    private void analyzeEventSummary(Statement stmt, Long eventId) throws SQLException {
        String sql = "INSERT OVERWRITE TABLE freeline.event_summary_result "
                + "SELECT "
                + "  " + eventId + ", "
                + "  COUNT(DISTINCT visitor_id), "
                + "  SUM(CASE WHEN action = 'waiting_register' THEN 1 ELSE 0 END), "
                + "  AVG(CASE WHEN action = 'waiting_complete' "
                + "    THEN UNIX_TIMESTAMP(client_timestamp) - "
                + "      UNIX_TIMESTAMP(metadata['registered_at']) ELSE NULL END), "
                + "  CASE WHEN SUM(CASE WHEN action = 'waiting_register' THEN 1 ELSE 0 END) > 0 "
                + "    THEN ROUND("
                + "      SUM(CASE WHEN action = 'waiting_cancel' THEN 1 ELSE 0 END) / "
                + "      SUM(CASE WHEN action = 'waiting_register' THEN 1 ELSE 0 END), 4) "
                + "    ELSE 0.0 END, "
                + "  NULL, "
                + "  FROM_UNIXTIME(UNIX_TIMESTAMP()) "
                + "FROM freeline.action_logs "
                + "WHERE event_id = " + eventId;

        stmt.execute(sql);
        updatePeakHour(stmt, eventId);
        log.info("Event summary analysis completed for event_id: {}", eventId);
    }

    private void updatePeakHour(Statement stmt, Long eventId) throws SQLException {
        String sql = "INSERT OVERWRITE TABLE freeline.event_summary_result "
                + "SELECT "
                + "  s.event_id, s.total_visitors, s.total_registrations, "
                + "  s.avg_waiting_seconds, s.overall_dropout_rate, "
                + "  h.datetime_hour, s.analyzed_at "
                + "FROM freeline.event_summary_result s "
                + "JOIN ("
                + "  SELECT datetime_hour "
                + "  FROM freeline.hourly_traffic_result "
                + "  WHERE event_id = " + eventId + " "
                + "  ORDER BY active_user_count DESC LIMIT 1"
                + ") h "
                + "WHERE s.event_id = " + eventId;

        stmt.execute(sql);
    }
}
