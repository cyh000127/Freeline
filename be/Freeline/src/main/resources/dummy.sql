-- 1. 더미 행사 주최자 생성
INSERT INTO event_admins (email, password, name, verified)
VALUES ('admin@freeline.com', '$2a$10$8K1p/a06vW.2YfH/.HhHre6Z5m9e.205pU.TjXz/O.H.U.W.O.W.W', '관리자',
        TRUE) ON CONFLICT (email) DO
UPDATE
    SET password = EXCLUDED.password,
    verified = EXCLUDED.verified,
    name = EXCLUDED.name;

-- 2. 더미 행사 생성
INSERT INTO events (event_admin_id, name, description, start_date, end_date, open_time, close_time, location_address,
                    status)
SELECT id,
       '인싸들의 성지 대축제',
       '최고의 축제 경험을 선사합니다.',
       CURRENT_DATE,
       CURRENT_DATE + INTERVAL '3 days', '09:00:00', '18:00:00', '서울시 강남구 테헤란로 212', 'PUBLISHED'
FROM event_admins
WHERE email = 'admin@freeline.com'
ON CONFLICT DO NOTHING;

-- 3. 더미 부스 20개 생성 (중복 방지 처리)
WITH target_event AS (SELECT id
                      FROM events
                      WHERE name = '인싸들의 성지 대축제' LIMIT 1
    )
INSERT
INTO booths (event_id, name, location_code, open_time, close_time, is_closed)
SELECT target_event.id,
       '부스 ' || i,
       'A-' || LPAD(i::text, 2, '0'),
       '10:00:00',
       '20:00:00',
       FALSE
FROM target_event,
     generate_series(1, 20) AS i
WHERE NOT EXISTS (SELECT 1 FROM booths b WHERE b.event_id = target_event.id AND b.name = '부스 ' || i);
