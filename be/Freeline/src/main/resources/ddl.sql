CREATE TABLE IF NOT EXISTS event_admins
(
    id         BIGSERIAL PRIMARY KEY,
    email      VARCHAR(120) NOT NULL,
    password   VARCHAR(255) NOT NULL,
    name       VARCHAR(50),
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_event_admins_email UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS events
(
    id                  BIGSERIAL PRIMARY KEY,
    event_admin_id      BIGINT       NOT NULL,
    name                VARCHAR(100) NOT NULL,
    description         TEXT         NOT NULL,
    start_date          DATE         NOT NULL,
    end_date            DATE         NOT NULL,
    open_time           TIME         NOT NULL,
    close_time          TIME         NOT NULL,
    location_address    VARCHAR(255) NOT NULL,
    thumbnail_image_url VARCHAR(500),
    status              VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
    created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_events_admin FOREIGN KEY (event_admin_id) REFERENCES event_admins (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS event_policies
(
    id                 BIGSERIAL PRIMARY KEY,
    event_id           BIGINT NOT NULL,
    expected_stay_time INT    NOT NULL DEFAULT 600,
    max_waiting_count  INT    NOT NULL DEFAULT 100,
    call_count         INT    NOT NULL DEFAULT 5,
    call_valid_time    INT    NOT NULL DEFAULT 180,
    defer_limit        INT    NOT NULL DEFAULT 2,
    CONSTRAINT fk_event_policies_event FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS event_maps
(
    id         BIGSERIAL PRIMARY KEY,
    event_id   BIGINT       NOT NULL,
    image_path VARCHAR(500) NOT NULL,
    is_visible BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_event_maps_event FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS booth_admins
(
    id         BIGSERIAL PRIMARY KEY,
    event_id   BIGINT       NOT NULL,
    email      VARCHAR(120) NOT NULL,
    password   VARCHAR(255) NOT NULL,
    name       VARCHAR(50),
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_booth_admins_event FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS booths
(
    id             BIGSERIAL PRIMARY KEY,
    event_id       BIGINT       NOT NULL,
    booth_admin_id BIGINT,
    name           VARCHAR(120) NOT NULL,
    location_code  VARCHAR(20),
    open_time      TIME,
    close_time     TIME,
    is_closed      BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_booths_event FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
    CONSTRAINT fk_booths_admin FOREIGN KEY (booth_admin_id) REFERENCES booth_admins (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS booth_policies
(
    id                BIGSERIAL PRIMARY KEY,
    booth_id          BIGINT NOT NULL,
    stay_time         INT,
    max_waiting_count INT,
    call_count        INT,
    call_valid_time   INT,
    defer_limit       INT,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_booth_policies_booth FOREIGN KEY (booth_id) REFERENCES booths (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS booth_goods
(
    id          BIGSERIAL PRIMARY KEY,
    booth_id    BIGINT       NOT NULL,
    name        VARCHAR(120) NOT NULL,
    image_path  VARCHAR(500) NOT NULL,
    is_sold_out BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_booth_goods_booth FOREIGN KEY (booth_id) REFERENCES booths (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS booth_images
(
    id                BIGSERIAL PRIMARY KEY,
    booth_id          BIGINT       NOT NULL,
    image_path        VARCHAR(500) NOT NULL,
    is_representative BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_booth_images_booth FOREIGN KEY (booth_id) REFERENCES booths (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS visitors
(
    id         BIGSERIAL PRIMARY KEY,
    event_id   BIGINT       NOT NULL,
    entry_code VARCHAR(255) NOT NULL,
    name       VARCHAR(255),
    is_active  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_visitors_event FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
    CONSTRAINT uq_visitor_entry_code UNIQUE (entry_code)
);

CREATE TABLE IF NOT EXISTS booth_waiting
(
    id             BIGSERIAL PRIMARY KEY,
    booth_id       BIGINT       NOT NULL,
    visitor_id     BIGINT       NOT NULL,
    status         VARCHAR(30)  NOT NULL DEFAULT 'WAITING',
    waiting_number INT          NOT NULL,
    defer_count    INT          NOT NULL DEFAULT 0,
    requested_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    called_at      TIMESTAMP,
    entered_at     TIMESTAMP,
    exited_at      TIMESTAMP,
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_waiting_booth FOREIGN KEY (booth_id) REFERENCES booths (id) ON DELETE CASCADE,
    CONSTRAINT fk_waiting_visitor FOREIGN KEY (visitor_id) REFERENCES visitors (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS booth_map_areas
(
    id           BIGSERIAL PRIMARY KEY,
    event_map_id BIGINT        NOT NULL,
    booth_id     BIGINT        NOT NULL,
    x_ratio      DECIMAL(7, 4) NOT NULL,
    y_ratio      DECIMAL(7, 4) NOT NULL,
    width_ratio  DECIMAL(7, 4) NOT NULL,
    height_ratio DECIMAL(7, 4) NOT NULL,
    created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_booth_map_areas_event_map FOREIGN KEY (event_map_id) REFERENCES event_maps (id) ON DELETE CASCADE,
    CONSTRAINT fk_booth_map_areas_booth FOREIGN KEY (booth_id) REFERENCES booths (id) ON DELETE CASCADE,
    CONSTRAINT uq_booth_map_areas_event_map_booth UNIQUE (event_map_id, booth_id)
);