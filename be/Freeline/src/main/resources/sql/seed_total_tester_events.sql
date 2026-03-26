BEGIN;

WITH target_admin AS (
    SELECT id
    FROM event_admins
    WHERE email = 'admin@test.com'
      AND name = '총괄테스터'
    LIMIT 1
),
generated_events AS (
    SELECT
        ta.id AS event_admin_id,
        gs AS seq,
        format('총괄테스터 샘플 행사 %s', lpad(gs::text, 2, '0')) AS name,
        format(
            '총괄테스터 계정 확인용 샘플 행사 %s입니다. 메인 목록 페이지네이션과 상태 표시를 검증하기 위한 테스트 데이터입니다.',
            lpad(gs::text, 2, '0')
        ) AS description,
        CURRENT_DATE + gs AS start_date,
        CURRENT_DATE + gs + ((gs - 1) % 3) AS end_date,
        TIME '10:00:00' + make_interval(mins => ((gs - 1) % 4) * 30) AS open_time,
        TIME '18:00:00' + make_interval(mins => ((gs - 1) % 3) * 30) AS close_time,
        format('서울특별시 강남구 테헤란로 %s', 100 + gs) AS location_address,
        CASE (gs - 1) % 5
            WHEN 0 THEN 'DRAFT'
            WHEN 1 THEN 'READY'
            WHEN 2 THEN 'OPEN'
            WHEN 3 THEN 'CLOSED'
            ELSE 'CANCELED'
        END AS status
    FROM target_admin ta
    CROSS JOIN generate_series(1, 30) AS gs
),
inserted_events AS (
    INSERT INTO events (
        event_admin_id,
        name,
        description,
        start_date,
        end_date,
        open_time,
        close_time,
        location_address,
        thumbnail_image_url,
        status
    )
    SELECT
        ge.event_admin_id,
        ge.name,
        ge.description,
        ge.start_date,
        ge.end_date,
        ge.open_time,
        ge.close_time,
        ge.location_address,
        NULL,
        ge.status
    FROM generated_events ge
    WHERE NOT EXISTS (
        SELECT 1
        FROM events e
        WHERE e.event_admin_id = ge.event_admin_id
          AND e.name = ge.name
    )
    RETURNING id, name
),
sample_events AS (
    SELECT ie.id, ie.name
    FROM inserted_events ie

    UNION

    SELECT e.id, e.name
    FROM events e
    JOIN target_admin ta ON ta.id = e.event_admin_id
    WHERE e.name LIKE '총괄테스터 샘플 행사 %'
)
INSERT INTO event_policies (
    event_id,
    default_stay_sec,
    default_max_waiting,
    default_call_count,
    default_call_ttl,
    default_defer_limit
)
SELECT
    se.id,
    300 + ((row_number() OVER (ORDER BY se.name) - 1) % 10) * 60,
    50 + ((row_number() OVER (ORDER BY se.name) - 1) % 6) * 25,
    2 + ((row_number() OVER (ORDER BY se.name) - 1) % 4),
    120 + ((row_number() OVER (ORDER BY se.name) - 1) % 8) * 30,
    1 + ((row_number() OVER (ORDER BY se.name) - 1) % 3)
FROM sample_events se
WHERE NOT EXISTS (
    SELECT 1
    FROM event_policies ep
    WHERE ep.event_id = se.id
);

COMMIT;
