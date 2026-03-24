-- ============================================
-- 문제 지점 탐지 Job (Task 3-6)
-- ============================================

CREATE TABLE IF NOT EXISTS freeline.problem_spots_result (
    event_id        BIGINT,
    issue_type      STRING,
    target_id       STRING,
    target_name     STRING,
    severity        STRING,
    issue_metric    DOUBLE,
    description     STRING,
    analyzed_at     STRING
) STORED AS PARQUET;

INSERT OVERWRITE TABLE freeline.problem_spots_result
SELECT * FROM (
    -- 1. 이탈률 이상치 부스 탐지 (이탈률 30% 이상 경고, 50% 이상 심각)
    SELECT 
        event_id,
        'HIGH_DROPOUT' AS issue_type,
        CAST(booth_id AS STRING) AS target_id,
        booth_name AS target_name,
        CASE WHEN dropout_rate >= 0.5 THEN 'CRITICAL' ELSE 'WARNING' END AS severity,
        dropout_rate AS issue_metric,
        concat('이탈률 경고: ', cast(cast(dropout_rate * 100.0 as int) as string), '%') AS description,
        current_timestamp() AS analyzed_at
    FROM freeline.booth_performance_result
    WHERE dropout_rate >= 0.3 AND register_count >= 10  -- 최소 모수 10명 이상일 때만 평가

    UNION ALL

    -- 2. 대기열 포화 시간대 탐지 (특정 시간대 대기 등록이 50건 이상일 때)
    SELECT
        event_id,
        'SATURATED_HOUR' AS issue_type,
        datetime_hour AS target_id,
        datetime_hour AS target_name,
        'WARNING' AS severity,
        CAST(register_count AS DOUBLE) AS issue_metric,
        concat('대기열 급증: 해당 시간대 대기 등록 ', cast(register_count as string), '건 누적') AS description,
        current_timestamp() AS analyzed_at
    FROM freeline.hourly_traffic_result
    WHERE register_count >= 50
) combined_issues;
