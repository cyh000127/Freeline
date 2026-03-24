-- ============================================
-- 동선 분석 Job (Task 3-5)
-- ============================================

CREATE TABLE IF NOT EXISTS freeline.visitor_path_result (
    event_id        BIGINT,
    path_string     STRING,
    visitor_count   BIGINT,
    analyzed_at     STRING
) STORED AS PARQUET;

INSERT OVERWRITE TABLE freeline.visitor_path_result
SELECT 
    event_id,
    path_string,
    COUNT(visitor_id) AS visitor_count,
    current_timestamp() AS analyzed_at
FROM (
    SELECT 
        event_id,
        visitor_id,
        concat_ws(' -> ', collect_list(o.name)) AS path_string
    FROM (
        SELECT 
            a.event_id,
            a.visitor_id,
            b.name,
            a.log_timestamp
        FROM freeline.action_logs a
        JOIN freeline.booths_dump b ON CAST(a.target_id AS BIGINT) = b.id
        WHERE a.action = 'BOOTH_VIEW' AND a.target_type = 'BOOTH'
        ORDER BY a.log_timestamp ASC
    ) o
    GROUP BY event_id, visitor_id
    HAVING count(o.name) >= 2
) p
GROUP BY event_id, path_string
ORDER BY visitor_count DESC;
