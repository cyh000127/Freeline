-- ============================================
-- 부스별 성과 분석 JOb (Task 3-3)
-- ============================================
-- 분석 결과를 저장할 내부 테이블 생성 (Parquet 포맷 권장)
CREATE TABLE IF NOT EXISTS freeline.booth_performance_result (
    event_id        BIGINT,
    booth_id        BIGINT,
    booth_name      STRING,
    view_count      BIGINT,
    register_count  BIGINT,
    dropout_count   BIGINT,
    conversion_rate DOUBLE,
    dropout_rate    DOUBLE,
    analyzed_at     STRING
)
STORED AS PARQUET;

-- 기존 외부 데이터를 기반으로 부스별 성과 집계 후 덮어쓰기
-- event_id 별로 실행할 수 있도록 변수 처리할 수 있으나, 일단 전체 부스 대상으로 분석 (필요 시 WHERE 절 추가)
INSERT OVERWRITE TABLE freeline.booth_performance_result
SELECT
    b.event_id,
    b.id AS booth_id,
    b.name AS booth_name,
    COALESCE(v.view_count, 0) AS view_count,
    COALESCE(r.register_count, 0) AS register_count,
    COALESCE(d.dropout_count, 0) AS dropout_count,
    -- 전환율: 조회수가 0이면 0.0, 아니면 (등록수 / 조회수)
    CASE 
        WHEN COALESCE(v.view_count, 0) = 0 THEN 0.0 
        ELSE CAST(COALESCE(r.register_count, 0) AS DOUBLE) / v.view_count 
    END AS conversion_rate,
    -- 이탈률: 등록수가 0이면 0.0, 아니면 (이탈수 / 등록수)
    CASE 
        WHEN COALESCE(r.register_count, 0) = 0 THEN 0.0 
        ELSE CAST(COALESCE(d.dropout_count, 0) AS DOUBLE) / r.register_count 
    END AS dropout_rate,
    current_timestamp() AS analyzed_at
FROM freeline.booths_dump b
LEFT JOIN (
    -- 조회수: action_logs 에서 BOOTH_VIEW & target_type = BOOTH
    SELECT 
        CAST(target_id AS BIGINT) AS booth_id,
        COUNT(1) AS view_count
    FROM freeline.action_logs
    WHERE action = 'BOOTH_VIEW' AND target_type = 'BOOTH'
    GROUP BY target_id
) v ON b.id = v.booth_id
LEFT JOIN (
    -- 등록수: booth_waiting_dump 에서 등록 요청 건수 (보통 모든 데이터이므로 id 기준 COUNT)
    SELECT 
        booth_id,
        COUNT(id) AS register_count
    FROM freeline.booth_waiting_dump
    GROUP BY booth_id
) r ON b.id = r.booth_id
LEFT JOIN (
    -- 이탈수: booth_waiting_dump 에서 status 가 CANCELED 또는 EXPIRED 인 건수
    SELECT 
        booth_id,
        COUNT(id) AS dropout_count
    FROM freeline.booth_waiting_dump
    WHERE status IN ('CANCELED', 'EXPIRED')
    GROUP BY booth_id
) d ON b.id = d.booth_id;
