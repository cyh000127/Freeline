-- =========================================================
-- Freeline Project: Database Schema Definition
-- Description: Canonical schema for PostgreSQL (Spring Boot Initialization)
-- =========================================================

-- 1. 계정 및 인증 (Account & Auth)
------------------------------------------------------------

-- 행사 주최자 (슈퍼 어드민)
CREATE TABLE IF NOT EXISTS event_admins
(
    id
    BIGSERIAL
    PRIMARY
    KEY,
    email
    VARCHAR
(
    255
) NOT NULL,
    password VARCHAR
(
    255
) NOT NULL,
    name VARCHAR
(
    255
),
    company VARCHAR
(
    255
),
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_event_admins_email UNIQUE
(
    email
)
    );

-- 이메일 인증 임시 저장소
CREATE TABLE IF NOT EXISTS email_verification
(
    id
    BIGSERIAL
    PRIMARY
    KEY,
    email
    VARCHAR
(
    255
),
    code VARCHAR
(
    255
),
    verified BOOLEAN NOT NULL DEFAULT FALSE
    );


-- 2. 행사 핵심 정보 (Event Core)
------------------------------------------------------------

-- 행사 정보
CREATE TABLE IF NOT EXISTS events
(
    id
    BIGSERIAL
    PRIMARY
    KEY,
    event_admin_id
    BIGINT
    NOT
    NULL,
    name
    VARCHAR
(
    100
) NOT NULL,
    description TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    location_address VARCHAR
(
    255
) NOT NULL,
    thumbnail_image_url VARCHAR
(
    500
),
    status VARCHAR
(
    20
) NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_events_admin FOREIGN KEY
(
    event_admin_id
) REFERENCES event_admins
(
    id
) ON DELETE CASCADE
    );

-- 행사 전역 설정 (Policy)
CREATE TABLE IF NOT EXISTS event_policies
(
    id
    BIGSERIAL
    PRIMARY
    KEY,
    event_id
    BIGINT
    NOT
    NULL,
    default_stay_sec
    INT
    NOT
    NULL
    DEFAULT
    600,
    default_max_waiting
    INT
    NOT
    NULL
    DEFAULT
    100,
    default_call_count
    INT
    NOT
    NULL
    DEFAULT
    5,
    default_call_ttl
    INT
    NOT
    NULL
    DEFAULT
    180,
    default_defer_limit
    INT
    NOT
    NULL
    DEFAULT
    2,
    created_at
    TIMESTAMP
    NOT
    NULL
    DEFAULT
    CURRENT_TIMESTAMP,
    updated_at
    TIMESTAMP
    NOT
    NULL
    DEFAULT
    CURRENT_TIMESTAMP,
    CONSTRAINT
    uq_event_policies_event
    UNIQUE
(
    event_id
),
    CONSTRAINT fk_event_policies_event FOREIGN KEY
(
    event_id
) REFERENCES events
(
    id
) ON DELETE CASCADE
    );

-- 행사 배치도 이미지
CREATE TABLE IF NOT EXISTS event_maps
(
    id
    BIGSERIAL
    PRIMARY
    KEY,
    event_id
    BIGINT
    NOT
    NULL,
    image_path
    VARCHAR
(
    500
) NOT NULL,
    is_visible BOOLEAN NOT NULL DEFAULT FALSE,
    mapping_snapshot JSON,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_event_maps_event FOREIGN KEY
(
    event_id
) REFERENCES events
(
    id
) ON DELETE CASCADE
    );


-- 3. 부스 정보 (Booth Management)
------------------------------------------------------------

-- 개별 부스
CREATE TABLE IF NOT EXISTS booths
(
    id
    BIGSERIAL
    PRIMARY
    KEY,
    event_id
    BIGINT
    NOT
    NULL,
    name
    VARCHAR
(
    120
) NOT NULL,
    location_code VARCHAR
(
    20
),
    open_time TIME,
    close_time TIME,
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_booths_event FOREIGN KEY
(
    event_id
) REFERENCES events
(
    id
) ON DELETE CASCADE
    );

-- 부스 관리자
CREATE TABLE IF NOT EXISTS booth_admins
(
    id
    BIGSERIAL
    PRIMARY
    KEY,
    booth_id
    BIGINT
    NOT
    NULL,
    login_id
    VARCHAR
(
    50
) NOT NULL,
    password VARCHAR
(
    255
) NOT NULL,
    admin_name VARCHAR
(
    50
),
    email VARCHAR
(
    120
) NOT NULL,
    company VARCHAR
(
    100
),
    status VARCHAR
(
    20
) NOT NULL DEFAULT 'CREATED',
    last_login_at TIMESTAMP,
    is_password_changed BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_booth_admins_booth FOREIGN KEY
(
    booth_id
) REFERENCES booths
(
    id
) ON DELETE CASCADE
    );

-- 부스 전용 정책 (개별 설정 가능)
CREATE TABLE IF NOT EXISTS booth_policies
(
    id
    BIGSERIAL
    PRIMARY
    KEY,
    booth_id
    BIGINT
    NOT
    NULL,
    stay_time
    INT,
    max_waiting_count
    INT,
    call_count
    INT,
    call_valid_time
    INT,
    defer_limit
    INT,
    created_at
    TIMESTAMP
    NOT
    NULL
    DEFAULT
    CURRENT_TIMESTAMP,
    updated_at
    TIMESTAMP
    NOT
    NULL
    DEFAULT
    CURRENT_TIMESTAMP,
    CONSTRAINT
    fk_booth_policies_booth
    FOREIGN
    KEY
(
    booth_id
) REFERENCES booths
(
    id
) ON DELETE CASCADE
    );

-- 부스 굿즈 및 이미지
CREATE TABLE IF NOT EXISTS booth_goods
(
    id
    BIGSERIAL
    PRIMARY
    KEY,
    booth_id
    BIGINT
    NOT
    NULL,
    name
    VARCHAR
(
    120
) NOT NULL,
    image_path VARCHAR
(
    500
) NOT NULL,
    is_sold_out BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_booth_goods_booth FOREIGN KEY
(
    booth_id
) REFERENCES booths
(
    id
) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS booth_images
(
    id
    BIGSERIAL
    PRIMARY
    KEY,
    booth_id
    BIGINT
    NOT
    NULL,
    image_path
    VARCHAR
(
    500
) NOT NULL,
    is_representative BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_booth_images_booth FOREIGN KEY
(
    booth_id
) REFERENCES booths
(
    id
) ON DELETE CASCADE
    );


-- 4. 방문객 및 웨이팅 (Visitor & Waiting)
------------------------------------------------------------

-- 방문객 정보
CREATE TABLE IF NOT EXISTS visitors
(
    id
    BIGSERIAL
    PRIMARY
    KEY,
    event_id
    BIGINT
    NOT
    NULL,
    entry_code
    VARCHAR
(
    255
) NOT NULL,
    name VARCHAR
(
    255
),
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_visitors_event FOREIGN KEY
(
    event_id
) REFERENCES events
(
    id
) ON DELETE CASCADE,
    CONSTRAINT uq_visitor_entry_code UNIQUE
(
    entry_code
)
    );

-- 실시간 웨이팅 현황
CREATE TABLE IF NOT EXISTS booth_waiting
(
    id
    BIGSERIAL
    PRIMARY
    KEY,
    booth_id
    BIGINT
    NOT
    NULL,
    visitor_id
    BIGINT
    NOT
    NULL,
    status
    VARCHAR
(
    30
) NOT NULL DEFAULT 'WAITING',
    waiting_number INT NOT NULL,
    defer_count INT NOT NULL DEFAULT 0,
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    called_at TIMESTAMP,
    call_expires_at TIMESTAMP,
    registered_at TIMESTAMP,
    entered_at TIMESTAMP,
    exited_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_waiting_booth FOREIGN KEY
(
    booth_id
) REFERENCES booths
(
    id
) ON DELETE CASCADE,
    CONSTRAINT fk_waiting_visitor FOREIGN KEY
(
    visitor_id
) REFERENCES visitors
(
    id
)
  ON DELETE CASCADE
    );

-- 부스 QR 정보
CREATE TABLE IF NOT EXISTS booth_qr
(
    id
    BIGSERIAL
    PRIMARY
    KEY,
    booth_id
    BIGINT
    NOT
    NULL,
    purpose
    VARCHAR
(
    50
) NOT NULL,
    qr_key VARCHAR
(
    255
) NOT NULL,
    payload_version VARCHAR
(
    20
) NOT NULL,
    issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    status VARCHAR
(
    20
) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_booth_qr_booth FOREIGN KEY
(
    booth_id
) REFERENCES booths
(
    id
) ON DELETE CASCADE,
    CONSTRAINT uq_booth_qr_qr_key UNIQUE
(
    qr_key
)
    );


-- 5. 시스템 및 인프라 (System Infra)
------------------------------------------------------------

-- 푸시 알림 토큰
CREATE TABLE IF NOT EXISTS fcm_token
(
    id
    BIGSERIAL
    PRIMARY
    KEY,
    visitor_id
    BIGINT
    NOT
    NULL,
    device_id
    VARCHAR
(
    255
) NOT NULL,
    fcm_token VARCHAR
(
    500
) NOT NULL,
    platform VARCHAR
(
    20
) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fcm_token_visitor FOREIGN KEY
(
    visitor_id
) REFERENCES visitors
(
    id
) ON DELETE CASCADE,
    CONSTRAINT uq_fcm_token_device_id UNIQUE
(
    device_id
)
    );

-- 지도상의 부스 좌표 (중요: 비율 기반 좌표)
CREATE TABLE IF NOT EXISTS booth_map_areas
(
    id
    BIGSERIAL
    PRIMARY
    KEY,
    event_map_id
    BIGINT
    NOT
    NULL,
    booth_id
    BIGINT
    NOT
    NULL,
    x_ratio
    DECIMAL
(
    7,
    4
) NOT NULL,
    y_ratio DECIMAL
(
    7,
    4
) NOT NULL,
    width_ratio DECIMAL
(
    7,
    4
) NOT NULL,
    height_ratio DECIMAL
(
    7,
    4
) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_booth_map_areas_event_map FOREIGN KEY
(
    event_map_id
) REFERENCES event_maps
(
    id
) ON DELETE CASCADE,
    CONSTRAINT fk_booth_map_areas_booth FOREIGN KEY
(
    booth_id
) REFERENCES booths
(
    id
)
  ON DELETE CASCADE,
    CONSTRAINT uq_booth_map_areas_event_map_booth UNIQUE
(
    event_map_id,
    booth_id
)
    );


-- 6. 분석 및 리포트 (BigData Analysis Results)
------------------------------------------------------------

-- 행사 요약 결과
CREATE TABLE IF NOT EXISTS event_summary_results
(
    id
    BIGSERIAL
    PRIMARY
    KEY,
    event_id
    BIGINT
    NOT
    NULL,
    total_visitors
    BIGINT,
    total_registrations
    BIGINT,
    avg_waiting_seconds
    DOUBLE
    PRECISION,
    overall_dropout_rate DOUBLE PRECISION,
    peak_hour
    VARCHAR
(
    30
),
    analyzed_at VARCHAR
(
    50
)
    );

-- 부스별 성과
CREATE TABLE IF NOT EXISTS booth_performance_results
(
    id              BIGSERIAL PRIMARY KEY,
    event_id
    BIGINT
    NOT
    NULL,
    booth_id
    BIGINT
    NOT
    NULL,
    booth_name      VARCHAR(100),
    view_count      BIGINT,
    register_count  BIGINT,
    dropout_count   BIGINT,
    conversion_rate DOUBLE PRECISION,
    dropout_rate    DOUBLE PRECISION,
    analyzed_at     VARCHAR(50)
    );

-- 시간대별 트래픽
CREATE TABLE IF NOT EXISTS hourly_traffic_results
(
    id                BIGSERIAL PRIMARY KEY,
    event_id          BIGINT NOT NULL,
    datetime_hour     VARCHAR(30),
    active_user_count BIGINT,
    register_count    BIGINT,
    analyzed_at       VARCHAR(50)
    );

-- 방문객 이동 경로 분석
CREATE TABLE IF NOT EXISTS visitor_path_results
(
    id            BIGSERIAL PRIMARY KEY,
    event_id      BIGINT NOT NULL,
    path_string   TEXT,
    visitor_count BIGINT,
    analyzed_at   VARCHAR(50)
    );

-- 병목 구간 및 문제 지점
CREATE TABLE IF NOT EXISTS problem_spot_results
(
    id           BIGSERIAL PRIMARY KEY,
    event_id     BIGINT NOT NULL,
    issue_type   VARCHAR(50),
    target_id    VARCHAR(50),
    target_name  VARCHAR(100),
    severity     VARCHAR(30),
    issue_metric DOUBLE PRECISION,
    description  TEXT,
    analyzed_at  VARCHAR(50)
    );


-- 7. 인덱스 설정 (Performance Tuning)
------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_booth_qr_booth_status ON booth_qr (booth_id, status);
CREATE INDEX IF NOT EXISTS idx_fcm_token_visitor_id ON fcm_token (visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitors_event_id ON visitors (event_id);
CREATE INDEX IF NOT EXISTS idx_waiting_booth_visitor_status ON booth_waiting (booth_id, visitor_id, status);
CREATE INDEX IF NOT EXISTS idx_waiting_booth_status_number ON booth_waiting (booth_id, status, waiting_number);
CREATE INDEX IF NOT EXISTS idx_waiting_visitor_status_booth ON booth_waiting (visitor_id, status, booth_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_booths_event_name_normalized ON booths (event_id, LOWER(TRIM(name)));
CREATE INDEX IF NOT EXISTS idx_evt_summary_event_id ON event_summary_results (event_id);
CREATE INDEX IF NOT EXISTS idx_booth_perf_event_id ON booth_performance_results (event_id);
CREATE INDEX IF NOT EXISTS idx_hourly_traffic_event_id ON hourly_traffic_results (event_id);
CREATE INDEX IF NOT EXISTS idx_visitor_path_event_id ON visitor_path_results (event_id);
CREATE INDEX IF NOT EXISTS idx_problem_spot_event_id ON problem_spot_results (event_id);
