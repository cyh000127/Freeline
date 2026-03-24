package com.freeline.domain.report.service;

import java.sql.ResultSet;
import java.sql.SQLException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.extern.slf4j.Slf4j;

import com.freeline.common.hdfs.HdfsClient;
import com.freeline.common.hdfs.HdfsException;

@Slf4j
@Service
public class DbDumpService {

    private static final String NULL_VALUE = "\\N";
    private static final String DB_DUMP_PATH = "/data/db_dump";

    private final JdbcTemplate jdbcTemplate;
    private final HdfsClient hdfsClient;
    private final String basePath;

    public DbDumpService(
            JdbcTemplate jdbcTemplate,
            HdfsClient hdfsClient,
            @Value("${hdfs.base-path:/data}") String basePath) {
        this.jdbcTemplate = jdbcTemplate;
        this.hdfsClient = hdfsClient;
        this.basePath = basePath;
    }

    @Transactional(readOnly = true)
    public void dumpEventData(Long eventId) {
        log.info("DB dump started for event {}", eventId);

        dumpBooths(eventId);
        dumpVisitors(eventId);
        dumpBoothWaiting(eventId);
        dumpBoothGoods(eventId);

        log.info("DB dump completed for event {}", eventId);
    }

    private void dumpBooths(Long eventId) {
        String sql = "SELECT id, event_id, name, location_code, is_closed, "
                + "open_time, close_time, created_at, updated_at "
                + "FROM booths WHERE event_id = ?";

        String tsv = extractAsTsv(sql, eventId);
        uploadToHdfs("booths", eventId, tsv);
    }

    private void dumpVisitors(Long eventId) {
        String sql = "SELECT id, event_id, entry_code, name, is_active, "
                + "created_at, updated_at "
                + "FROM visitors WHERE event_id = ?";

        String tsv = extractAsTsv(sql, eventId);
        uploadToHdfs("visitors", eventId, tsv);
    }

    private void dumpBoothWaiting(Long eventId) {
        String sql = "SELECT bw.id, bw.booth_id, bw.visitor_id, bw.status, "
                + "bw.waiting_number, bw.defer_count, bw.requested_at, "
                + "bw.called_at, bw.created_at, bw.updated_at "
                + "FROM booth_waiting bw "
                + "JOIN booths b ON bw.booth_id = b.id "
                + "WHERE b.event_id = ?";

        String tsv = extractAsTsv(sql, eventId);
        uploadToHdfs("booth_waiting", eventId, tsv);
    }

    private void dumpBoothGoods(Long eventId) {
        String sql = "SELECT bg.id, bg.booth_id, bg.name, bg.image_path, "
                + "bg.is_sold_out, bg.created_at, bg.updated_at "
                + "FROM booth_goods bg "
                + "JOIN booths b ON bg.booth_id = b.id "
                + "WHERE b.event_id = ?";

        String tsv = extractAsTsv(sql, eventId);
        uploadToHdfs("booth_goods", eventId, tsv);
    }

    private String extractAsTsv(String sql, Object... args) {
        StringBuilder sb = new StringBuilder();
        jdbcTemplate.query(sql, rs -> {
            appendRow(sb, rs);
        }, args);
        return sb.toString();
    }

    private void appendRow(StringBuilder sb, ResultSet rs) throws SQLException {
        int columnCount = rs.getMetaData().getColumnCount();
        for (int i = 1; i <= columnCount; i++) {
            if (i > 1) {
                sb.append('\t');
            }
            String value = rs.getString(i);
            sb.append(value != null ? escapeForTsv(value) : NULL_VALUE);
        }
        sb.append('\n');
    }

    private String escapeForTsv(String value) {
        return value.replace("\t", " ").replace("\n", " ").replace("\r", "");
    }

    private void uploadToHdfs(String tableName, Long eventId, String tsv) {
        String dirPath = DB_DUMP_PATH + "/" + tableName;
        String filePath = dirPath + "/event_" + eventId + ".tsv";

        try {
            hdfsClient.mkdirs(dirPath);
            hdfsClient.createFile(filePath, tsv);
            log.info("Uploaded {} rows to HDFS: {}", countLines(tsv), filePath);
        } catch (HdfsException e) {
            log.error("HDFS upload failed for {}: {}", filePath, e.getMessage());
            throw e;
        }
    }

    private long countLines(String text) {
        if (text.isEmpty()) {
            return 0;
        }
        return text.chars().filter(c -> c == '\n').count();
    }
}
