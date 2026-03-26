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
                + "  b.id, "
                + "  b.name, "
                + "  COALESCE(v.view_count, 0), "
                + "  COALESCE(w.register_count, 0), "
                + "  COALESCE(w.dropout_count, 0), "
                + "  CASE WHEN COALESCE(v.view_count, 0) > 0 "
                + "    THEN ROUND(COALESCE(w.converted_visitor_count, 0) / CAST(v.view_count AS DOUBLE), 4) "
                + "    ELSE 0.0 END, "
                + "  CASE WHEN COALESCE(w.register_count, 0) > 0 "
                + "    THEN ROUND(COALESCE(w.dropout_count, 0) / CAST(w.register_count AS DOUBLE), 4) "
                + "    ELSE 0.0 END, "
                + "  FROM_UNIXTIME(UNIX_TIMESTAMP()) "
                + "FROM freeline.booths_dump b "
                + "LEFT JOIN ("
                + "  SELECT CAST(target_id AS BIGINT) AS booth_id, COUNT(DISTINCT visitor_id) AS view_count "
                + "  FROM freeline.action_logs "
                + "  WHERE event_id = " + eventId + " AND action = 'BOOTH_VIEW' AND target_type = 'BOOTH' "
                + "  GROUP BY CAST(target_id AS BIGINT)"
                + ") v ON b.id = v.booth_id "
                + "LEFT JOIN ("
                + "  SELECT bw.booth_id, "
                + "    COUNT(*) AS register_count, "
                + "    SUM(CASE WHEN bw.status IN ('CANCELED', 'EXPIRED') THEN 1 ELSE 0 END) AS dropout_count, "
                + "    COUNT(DISTINCT CASE WHEN bw.status NOT IN ('CANCELED', 'EXPIRED') THEN bw.visitor_id END) "
                + "      AS converted_visitor_count "
                + "  FROM freeline.booth_waiting_dump bw "
                + "  JOIN freeline.booths_dump event_booths ON bw.booth_id = event_booths.id "
                + "  WHERE event_booths.event_id = " + eventId + " "
                + "  GROUP BY bw.booth_id"
                + ") w ON b.id = w.booth_id "
                + "WHERE b.event_id = " + eventId;

        stmt.execute(sql);
        log.info("Booth performance analysis completed for event_id: {}", eventId);
    }

    private void analyzeHourlyTraffic(Statement stmt, Long eventId) throws SQLException {
        String normalizedActionHour = "CASE "
                + "WHEN client_timestamp LIKE '%T%' THEN "
                + "  DATE_FORMAT(FROM_UTC_TIMESTAMP(CAST(REPLACE(SUBSTR(client_timestamp, 1, 19), 'T', ' ') AS TIMESTAMP), 'Asia/Seoul'), 'yyyy-MM-dd HH') "
                + "ELSE SUBSTR(client_timestamp, 1, 13) "
                + "END";

        String sql = "INSERT OVERWRITE TABLE freeline.hourly_traffic_result "
                + "SELECT "
                + "  " + eventId + ", "
                + "  h.datetime_hour, "
                + "  COALESCE(a.active_user_count, 0), "
                + "  COALESCE(w.register_count, 0), "
                + "  FROM_UNIXTIME(UNIX_TIMESTAMP()) "
                + "FROM ("
                + "  SELECT datetime_hour "
                + "  FROM ("
                + "    SELECT " + normalizedActionHour + " AS datetime_hour "
                + "    FROM freeline.action_logs "
                + "    WHERE event_id = " + eventId + " "
                + "    UNION ALL "
                + "    SELECT SUBSTR(bw.requested_at, 1, 13) AS datetime_hour "
                + "    FROM freeline.booth_waiting_dump bw "
                + "    JOIN freeline.booths_dump event_booths ON bw.booth_id = event_booths.id "
                + "    WHERE event_booths.event_id = " + eventId + " "
                + "  ) hours "
                + "  GROUP BY datetime_hour"
                + ") h "
                + "LEFT JOIN ("
                + "  SELECT " + normalizedActionHour + " AS datetime_hour, "
                + "    COUNT(DISTINCT visitor_id) AS active_user_count "
                + "  FROM freeline.action_logs "
                + "  WHERE event_id = " + eventId + " "
                + "  GROUP BY " + normalizedActionHour
                + ") a ON h.datetime_hour = a.datetime_hour "
                + "LEFT JOIN ("
                + "  SELECT SUBSTR(bw.requested_at, 1, 13) AS datetime_hour, COUNT(*) AS register_count "
                + "  FROM freeline.booth_waiting_dump bw "
                + "  JOIN freeline.booths_dump event_booths ON bw.booth_id = event_booths.id "
                + "  WHERE event_booths.event_id = " + eventId + " "
                + "  GROUP BY SUBSTR(bw.requested_at, 1, 13)"
                + ") w ON h.datetime_hour = w.datetime_hour";

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
                + "    WHERE event_id = " + eventId + " AND action = 'BOOTH_VIEW' "
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
                + "  event_id, "
                + "  'HIGH_DROPOUT', "
                + "  CAST(booth_id AS STRING), "
                + "  booth_name, "
                + "  CASE "
                + "    WHEN dropout_rate >= 0.6 THEN 'CRITICAL' "
                + "    WHEN dropout_rate >= 0.4 THEN 'HIGH' "
                + "    ELSE 'MEDIUM' END, "
                + "  dropout_rate, "
                + "  CONCAT(booth_name, ': dropout rate ', ROUND(dropout_rate * 100, 1), '%'), "
                + "  FROM_UNIXTIME(UNIX_TIMESTAMP()) "
                + "FROM freeline.booth_performance_result "
                + "WHERE event_id = " + eventId + " "
                + "  AND register_count >= 5 "
                + "  AND dropout_rate >= 0.3";

        stmt.execute(sql);
        log.info("Problem spots analysis completed for event_id: {}", eventId);
    }

    private void analyzeEventSummary(Statement stmt, Long eventId) throws SQLException {
        String sql = "INSERT OVERWRITE TABLE freeline.event_summary_result "
                + "SELECT "
                + "  " + eventId + ", "
                + "  COALESCE(visitor_stats.total_visitors, 0), "
                + "  COALESCE(waiting_stats.total_registrations, 0), "
                + "  ROUND(waiting_stats.avg_waiting_seconds, 1), "
                + "  CASE WHEN COALESCE(waiting_stats.total_registrations, 0) > 0 "
                + "    THEN ROUND(waiting_stats.dropout_count / CAST(waiting_stats.total_registrations AS DOUBLE), 4) "
                + "    ELSE 0.0 END, "
                + "  NULL, "
                + "  FROM_UNIXTIME(UNIX_TIMESTAMP()) "
                + "FROM ("
                + "  SELECT COUNT(DISTINCT visitor_id) AS total_visitors "
                + "  FROM ("
                + "    SELECT visitor_id FROM freeline.action_logs WHERE event_id = " + eventId + " "
                + "    UNION ALL "
                + "    SELECT bw.visitor_id "
                + "    FROM freeline.booth_waiting_dump bw "
                + "    JOIN freeline.booths_dump event_booths ON bw.booth_id = event_booths.id "
                + "    WHERE event_booths.event_id = " + eventId + " "
                + "  ) visitor_union"
                + ") visitor_stats "
                + "CROSS JOIN ("
                + "  SELECT "
                + "    COUNT(*) AS total_registrations, "
                + "    SUM(CASE WHEN bw.status IN ('CANCELED', 'EXPIRED') THEN 1 ELSE 0 END) AS dropout_count, "
                + "    AVG(CASE "
                + "      WHEN bw.requested_at IS NULL OR bw.status = 'WAITING' THEN NULL "
                + "      WHEN bw.status = 'CALLED' AND bw.called_at IS NOT NULL THEN "
                + "        UNIX_TIMESTAMP(SUBSTR(bw.called_at, 1, 19), 'yyyy-MM-dd HH:mm:ss') "
                + "        - UNIX_TIMESTAMP(SUBSTR(bw.requested_at, 1, 19), 'yyyy-MM-dd HH:mm:ss') "
                + "      WHEN bw.status = 'REGISTERED' AND bw.registered_at IS NOT NULL THEN "
                + "        UNIX_TIMESTAMP(SUBSTR(bw.registered_at, 1, 19), 'yyyy-MM-dd HH:mm:ss') "
                + "        - UNIX_TIMESTAMP(SUBSTR(bw.requested_at, 1, 19), 'yyyy-MM-dd HH:mm:ss') "
                + "      WHEN bw.status IN ('ENTERED', 'EXITED') AND bw.entered_at IS NOT NULL THEN "
                + "        UNIX_TIMESTAMP(SUBSTR(bw.entered_at, 1, 19), 'yyyy-MM-dd HH:mm:ss') "
                + "        - UNIX_TIMESTAMP(SUBSTR(bw.requested_at, 1, 19), 'yyyy-MM-dd HH:mm:ss') "
                + "      WHEN bw.status = 'EXPIRED' AND bw.call_expires_at IS NOT NULL THEN "
                + "        UNIX_TIMESTAMP(SUBSTR(bw.call_expires_at, 1, 19), 'yyyy-MM-dd HH:mm:ss') "
                + "        - UNIX_TIMESTAMP(SUBSTR(bw.requested_at, 1, 19), 'yyyy-MM-dd HH:mm:ss') "
                + "      ELSE "
                + "        UNIX_TIMESTAMP(SUBSTR(bw.updated_at, 1, 19), 'yyyy-MM-dd HH:mm:ss') "
                + "        - UNIX_TIMESTAMP(SUBSTR(bw.requested_at, 1, 19), 'yyyy-MM-dd HH:mm:ss') "
                + "    END) AS avg_waiting_seconds "
                + "  FROM freeline.booth_waiting_dump bw "
                + "  JOIN freeline.booths_dump event_booths ON bw.booth_id = event_booths.id "
                + "  WHERE event_booths.event_id = " + eventId + " "
                + ") waiting_stats";

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
                + "LEFT JOIN ("
                + "  SELECT datetime_hour "
                + "  FROM freeline.hourly_traffic_result "
                + "  WHERE event_id = " + eventId + " "
                + "  ORDER BY active_user_count DESC LIMIT 1"
                + ") h ON true "
                + "WHERE s.event_id = " + eventId;

        stmt.execute(sql);
    }
}
