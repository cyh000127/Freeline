-- =========================================================
-- Freeline hotfix migration
-- - For manually patching already-created databases
-- - Execute once with DBeaver / psql / other DB tool
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

DO
$$
BEGIN
    IF
EXISTS (
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

        IF
EXISTS (
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

        IF
EXISTS (
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

        IF
EXISTS (
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

        IF
EXISTS (
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
ALTER
COLUMN default_stay_sec SET DEFAULT 600;
ALTER TABLE IF EXISTS event_policies
ALTER
COLUMN default_stay_sec SET NOT NULL;
ALTER TABLE IF EXISTS event_policies
ALTER
COLUMN default_max_waiting SET DEFAULT 100;
ALTER TABLE IF EXISTS event_policies
ALTER
COLUMN default_max_waiting SET NOT NULL;
ALTER TABLE IF EXISTS event_policies
ALTER
COLUMN default_call_count SET DEFAULT 5;
ALTER TABLE IF EXISTS event_policies
ALTER
COLUMN default_call_count SET NOT NULL;
ALTER TABLE IF EXISTS event_policies
ALTER
COLUMN default_call_ttl SET DEFAULT 180;
ALTER TABLE IF EXISTS event_policies
ALTER
COLUMN default_call_ttl SET NOT NULL;
ALTER TABLE IF EXISTS event_policies
ALTER
COLUMN default_defer_limit SET DEFAULT 2;
ALTER TABLE IF EXISTS event_policies
ALTER
COLUMN default_defer_limit SET NOT NULL;

DO
$$
BEGIN
    IF
EXISTS (
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
