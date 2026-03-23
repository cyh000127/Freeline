-- =========================================================
-- Freeline canonical schema
-- - Fresh database bootstrap
-- - Idempotent hotfixes for already-initialized databases
-- =========================================================

-- =========================================================
-- 1. EVENT ADMIN
-- =========================================================
CREATE TABLE IF NOT EXISTS event_admins (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    organization VARCHAR(255),
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_event_admins_email UNIQUE (email)
);


-- =========================================================
-- 2. EMAIL VERIFICATION
-- =========================================================
CREATE TABLE IF NOT EXISTS email_verification (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255),
    code VARCHAR(255),
    verified BOOLEAN NOT NULL DEFAULT FALSE
);


-- =========================================================
-- 3. EVENT
-- =========================================================
CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    event_admin_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    location_address VARCHAR(255) NOT NULL,
    thumbnail_image_url VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_events_admin
        FOREIGN KEY (event_admin_id)
        REFERENCES event_admins (id)
        ON DELETE CASCADE
);


-- =========================================================
-- 4. EVENT POLICY
-- =========================================================
CREATE TABLE IF NOT EXISTS event_policies (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL,
    default_stay_sec INT NOT NULL DEFAULT 600,
    default_max_waiting INT NOT NULL DEFAULT 100,
    default_call_count INT NOT NULL DEFAULT 5,
    default_call_ttl INT NOT NULL DEFAULT 180,
    default_defer_limit INT NOT NULL DEFAULT 2,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_event_policies_event UNIQUE (event_id),
    CONSTRAINT fk_event_policies_event
        FOREIGN KEY (event_id)
        REFERENCES events (id)
        ON DELETE CASCADE
);


-- =========================================================
-- 5. EVENT MAP
-- =========================================================
CREATE TABLE IF NOT EXISTS event_maps (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL,
    image_path VARCHAR(500) NOT NULL,
    is_visible BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_event_maps_event
        FOREIGN KEY (event_id)
        REFERENCES events (id)
        ON DELETE CASCADE
);


-- =========================================================
-- 6. BOOTH
-- =========================================================
CREATE TABLE IF NOT EXISTS booths (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL,
    name VARCHAR(120) NOT NULL,
    location_code VARCHAR(20),
    open_time TIME,
    close_time TIME,
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_booths_event
        FOREIGN KEY (event_id)
        REFERENCES events (id)
        ON DELETE CASCADE
);


-- =========================================================
-- 7. BOOTH ADMIN
-- =========================================================
CREATE TABLE IF NOT EXISTS booth_admins (
    id BIGSERIAL PRIMARY KEY,
    booth_id BIGINT NOT NULL,
    login_id VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    admin_name VARCHAR(50),
    email VARCHAR(120) NOT NULL,
    is_email_sent BOOLEAN NOT NULL DEFAULT FALSE,
    is_account_issued BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_booth_admins_booth
        FOREIGN KEY (booth_id)
        REFERENCES booths (id)
        ON DELETE CASCADE
);


-- =========================================================
-- 8. BOOTH POLICY
-- =========================================================
CREATE TABLE IF NOT EXISTS booth_policies (
    id BIGSERIAL PRIMARY KEY,
    booth_id BIGINT NOT NULL,
    stay_time INT,
    max_waiting_count INT,
    call_count INT,
    call_valid_time INT,
    defer_limit INT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_booth_policies_booth
        FOREIGN KEY (booth_id)
        REFERENCES booths (id)
        ON DELETE CASCADE
);


-- =========================================================
-- 9. BOOTH GOODS
-- =========================================================
CREATE TABLE IF NOT EXISTS booth_goods (
    id BIGSERIAL PRIMARY KEY,
    booth_id BIGINT NOT NULL,
    name VARCHAR(120) NOT NULL,
    image_path VARCHAR(500) NOT NULL,
    is_sold_out BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_booth_goods_booth
        FOREIGN KEY (booth_id)
        REFERENCES booths (id)
        ON DELETE CASCADE
);


-- =========================================================
-- 10. VISITOR
-- =========================================================
CREATE TABLE IF NOT EXISTS visitors (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL,
    entry_code VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_visitors_event
        FOREIGN KEY (event_id)
        REFERENCES events (id)
        ON DELETE CASCADE,
    CONSTRAINT uq_visitor_entry_code UNIQUE (entry_code)
);


-- =========================================================
-- 11. BOOTH WAITING
-- =========================================================
CREATE TABLE IF NOT EXISTS booth_waiting (
    id BIGSERIAL PRIMARY KEY,
    booth_id BIGINT NOT NULL,
    visitor_id BIGINT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'WAITING',
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

    CONSTRAINT fk_waiting_booth
        FOREIGN KEY (booth_id)
        REFERENCES booths (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_waiting_visitor
        FOREIGN KEY (visitor_id)
        REFERENCES visitors (id)
        ON DELETE CASCADE
);


-- =========================================================
-- 12. BOOTH QR
-- =========================================================
CREATE TABLE IF NOT EXISTS booth_qr (
    id BIGSERIAL PRIMARY KEY,
    booth_id BIGINT NOT NULL,
    purpose VARCHAR(50) NOT NULL,
    qr_key VARCHAR(255) NOT NULL,
    payload_version VARCHAR(20) NOT NULL,
    issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_booth_qr_booth
        FOREIGN KEY (booth_id)
        REFERENCES booths (id)
        ON DELETE CASCADE,
    CONSTRAINT uq_booth_qr_qr_key UNIQUE (qr_key)
);

CREATE INDEX IF NOT EXISTS idx_booth_qr_booth_status
    ON booth_qr (booth_id, status);


-- =========================================================
-- 13. FCM TOKEN
-- =========================================================
CREATE TABLE IF NOT EXISTS fcm_token (
    id BIGSERIAL PRIMARY KEY,
    visitor_id BIGINT NOT NULL,
    device_id VARCHAR(255) NOT NULL,
    fcm_token VARCHAR(500) NOT NULL,
    platform VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_fcm_token_visitor
        FOREIGN KEY (visitor_id)
        REFERENCES visitors (id)
        ON DELETE CASCADE,
    CONSTRAINT uq_fcm_token_device_id UNIQUE (device_id)
);

CREATE INDEX IF NOT EXISTS idx_fcm_token_visitor_id
    ON fcm_token (visitor_id);


-- =========================================================
-- 14. EVENT MAP AREA
-- =========================================================
CREATE TABLE IF NOT EXISTS booth_map_areas (
    id BIGSERIAL PRIMARY KEY,
    event_map_id BIGINT NOT NULL,
    booth_id BIGINT NOT NULL,
    x_ratio DECIMAL(7, 4) NOT NULL,
    y_ratio DECIMAL(7, 4) NOT NULL,
    width_ratio DECIMAL(7, 4) NOT NULL,
    height_ratio DECIMAL(7, 4) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_booth_map_areas_event_map
        FOREIGN KEY (event_map_id)
        REFERENCES event_maps (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_booth_map_areas_booth
        FOREIGN KEY (booth_id)
        REFERENCES booths (id)
        ON DELETE CASCADE,
    CONSTRAINT uq_booth_map_areas_event_map_booth
        UNIQUE (event_map_id, booth_id)
);

CREATE INDEX IF NOT EXISTS idx_booth_waiting_booth_visitor_status
    ON booth_waiting (booth_id, visitor_id, status);


-- =========================================================
-- Hotfix for already-created databases
-- =========================================================
ALTER TABLE IF EXISTS event_admins
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE IF EXISTS event_admins
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE IF EXISTS events
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE IF EXISTS events
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE IF EXISTS event_maps
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE IF EXISTS event_maps
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE IF EXISTS booths
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE IF EXISTS booths
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE IF EXISTS booth_admins
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE IF EXISTS booth_admins
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE IF EXISTS booth_policies
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE IF EXISTS booth_policies
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE IF EXISTS booth_goods
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE IF EXISTS booth_goods
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE IF EXISTS visitors
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE IF EXISTS visitors
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE IF EXISTS booth_waiting
    ADD COLUMN IF NOT EXISTS call_expires_at TIMESTAMP;
ALTER TABLE IF EXISTS booth_waiting
    ADD COLUMN IF NOT EXISTS registered_at TIMESTAMP;
ALTER TABLE IF EXISTS booth_waiting
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE IF EXISTS booth_waiting
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE IF EXISTS booth_qr
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE IF EXISTS booth_qr
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE IF EXISTS fcm_token
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE IF EXISTS fcm_token
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE IF EXISTS booth_map_areas
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE IF EXISTS booth_map_areas
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE IF EXISTS event_policies
    ADD COLUMN IF NOT EXISTS default_stay_sec INT;
ALTER TABLE IF EXISTS event_policies
    ADD COLUMN IF NOT EXISTS default_max_waiting INT;
ALTER TABLE IF EXISTS event_policies
    ADD COLUMN IF NOT EXISTS default_call_count INT;
ALTER TABLE IF EXISTS event_policies
    ADD COLUMN IF NOT EXISTS default_call_ttl INT;
ALTER TABLE IF EXISTS event_policies
    ADD COLUMN IF NOT EXISTS default_defer_limit INT;
ALTER TABLE IF EXISTS event_policies
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE IF EXISTS event_policies
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = current_schema()
          AND table_name = 'event_policies'
    ) THEN
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'event_policies'
              AND column_name = 'expected_stay_time'
        ) THEN
            UPDATE event_policies
            SET default_stay_sec = COALESCE(default_stay_sec, expected_stay_time, 600)
            WHERE default_stay_sec IS NULL;
        ELSE
            UPDATE event_policies
            SET default_stay_sec = COALESCE(default_stay_sec, 600)
            WHERE default_stay_sec IS NULL;
        END IF;

        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'event_policies'
              AND column_name = 'max_waiting_count'
        ) THEN
            UPDATE event_policies
            SET default_max_waiting = COALESCE(default_max_waiting, max_waiting_count, 100)
            WHERE default_max_waiting IS NULL;
        ELSE
            UPDATE event_policies
            SET default_max_waiting = COALESCE(default_max_waiting, 100)
            WHERE default_max_waiting IS NULL;
        END IF;

        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'event_policies'
              AND column_name = 'call_count'
        ) THEN
            UPDATE event_policies
            SET default_call_count = COALESCE(default_call_count, call_count, 5)
            WHERE default_call_count IS NULL;
        ELSE
            UPDATE event_policies
            SET default_call_count = COALESCE(default_call_count, 5)
            WHERE default_call_count IS NULL;
        END IF;

        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'event_policies'
              AND column_name = 'call_valid_time'
        ) THEN
            UPDATE event_policies
            SET default_call_ttl = COALESCE(default_call_ttl, call_valid_time, 180)
            WHERE default_call_ttl IS NULL;
        ELSE
            UPDATE event_policies
            SET default_call_ttl = COALESCE(default_call_ttl, 180)
            WHERE default_call_ttl IS NULL;
        END IF;

        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'event_policies'
              AND column_name = 'defer_limit'
        ) THEN
            UPDATE event_policies
            SET default_defer_limit = COALESCE(default_defer_limit, defer_limit, 2)
            WHERE default_defer_limit IS NULL;
        ELSE
            UPDATE event_policies
            SET default_defer_limit = COALESCE(default_defer_limit, 2)
            WHERE default_defer_limit IS NULL;
        END IF;
    END IF;
END $$;

ALTER TABLE IF EXISTS event_policies
    ALTER COLUMN default_stay_sec SET DEFAULT 600;
ALTER TABLE IF EXISTS event_policies
    ALTER COLUMN default_stay_sec SET NOT NULL;
ALTER TABLE IF EXISTS event_policies
    ALTER COLUMN default_max_waiting SET DEFAULT 100;
ALTER TABLE IF EXISTS event_policies
    ALTER COLUMN default_max_waiting SET NOT NULL;
ALTER TABLE IF EXISTS event_policies
    ALTER COLUMN default_call_count SET DEFAULT 5;
ALTER TABLE IF EXISTS event_policies
    ALTER COLUMN default_call_count SET NOT NULL;
ALTER TABLE IF EXISTS event_policies
    ALTER COLUMN default_call_ttl SET DEFAULT 180;
ALTER TABLE IF EXISTS event_policies
    ALTER COLUMN default_call_ttl SET NOT NULL;
ALTER TABLE IF EXISTS event_policies
    ALTER COLUMN default_defer_limit SET DEFAULT 2;
ALTER TABLE IF EXISTS event_policies
    ALTER COLUMN default_defer_limit SET NOT NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = current_schema()
          AND table_name = 'event_policies'
    ) AND NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'uq_event_policies_event'
    ) THEN
        ALTER TABLE event_policies
            ADD CONSTRAINT uq_event_policies_event UNIQUE (event_id);
    END IF;
END $$;
