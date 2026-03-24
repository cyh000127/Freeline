-- ============================================
-- 시간대 유입량 분석 Job (Task 3-4)
-- ============================================

CREATE TABLE IF NOT EXISTS freeline.hourly_traffic_result (
    event_id        BIGINT,
    datetime_hour   STRING,
    active_user_count BIGINT,
    register_count    BIGINT,
    analyzed_at     STRING
)
STORED AS PARQUET;

INSERT OVERWRITE TABLE freeline.hourly_traffic_result
SELECT
    COALESCE(a.event_id, r.event_id) AS event_id,
    COALESCE(a.datetime_hour, r.datetime_hour) AS datetime_hour,
    COALESCE(a.active_user_count, 0) AS active_user_count,
    COALESCE(r.register_count, 0) AS register_count,
    current_timestamp() AS analyzed_at
FROM (
    -- 액티브 방문자 수 집계
    SELECT 
        event_id,
        substr(log_timestamp, 1, 13) AS datetime_hour,
        COUNT(DISTINCT visitor_id) AS active_user_count
    FROM freeline.action_logs
    WHERE log_timestamp IS NOT NULL
    GROUP BY event_id, substr(log_timestamp, 1, 13)
) a
FULL OUTER JOIN (
    -- 대기 등록 수 집계
    SELECT 
        b.event_id,
        substr(w.created_at, 1, 13) AS datetime_hour,
        COUNT(w.id) AS register_count
    FROM freeline.booth_waiting_dump w
    JOIN freeline.booths_dump b ON w.booth_id = b.id
    WHERE w.created_at IS NOT NULL
    GROUP BY b.event_id, substr(w.created_at, 1, 13)
) r ON a.event_id = r.event_id AND a.datetime_hour = r.datetime_hour;
