-- Hive 외부 테이블 초기 생성 스크립트
-- Usage: docker exec hive-server beeline -u jdbc:hive2://localhost:10000 -f /scripts/init-hive.sql

-- ============================================
-- 행동 로그 외부 테이블 (Flume → HDFS 적재분)
-- ============================================
CREATE DATABASE IF NOT EXISTS freeline;
USE freeline;

CREATE EXTERNAL TABLE IF NOT EXISTS action_logs (
    log_timestamp   STRING COMMENT '서버 기록 시각',
    event_id        BIGINT COMMENT '행사 ID',
    visitor_id      BIGINT COMMENT '방문자 ID',
    action          STRING COMMENT '행동 유형 (BOOTH_VIEW, WAITING_REGISTER 등)',
    target_type     STRING COMMENT '대상 유형 (BOOTH, GOODS, PAGE 등)',
    target_id       STRING COMMENT '대상 ID',
    metadata        STRING COMMENT 'JSON 추가 정보',
    client_timestamp STRING COMMENT '클라이언트 발생 시각',
    session_id      STRING COMMENT '세션 ID'
)
ROW FORMAT DELIMITED
    FIELDS TERMINATED BY '\t'
    LINES TERMINATED BY '\n'
STORED AS TEXTFILE
LOCATION 'hdfs://namenode:9000/data/logs/action'
TBLPROPERTIES ('skip.header.line.count'='0');

-- ============================================
-- DB 덤프 테이블 (행사 종료 후 적재)
-- ============================================
CREATE EXTERNAL TABLE IF NOT EXISTS booth_waiting_dump (
    id              BIGINT,
    booth_id        BIGINT,
    visitor_id      BIGINT,
    status          STRING,
    waiting_number  INT,
    defer_count     INT,
    requested_at    STRING,
    called_at       STRING,
    created_at      STRING,
    updated_at      STRING
)
ROW FORMAT DELIMITED
    FIELDS TERMINATED BY '\t'
    LINES TERMINATED BY '\n'
STORED AS TEXTFILE
LOCATION 'hdfs://namenode:9000/data/db_dump/booth_waiting';

CREATE EXTERNAL TABLE IF NOT EXISTS booths_dump (
    id              BIGINT,
    event_id        BIGINT,
    name            STRING,
    location_code   STRING,
    is_closed       BOOLEAN,
    open_time       STRING,
    close_time      STRING,
    created_at      STRING,
    updated_at      STRING
)
ROW FORMAT DELIMITED
    FIELDS TERMINATED BY '\t'
    LINES TERMINATED BY '\n'
STORED AS TEXTFILE
LOCATION 'hdfs://namenode:9000/data/db_dump/booths';

CREATE EXTERNAL TABLE IF NOT EXISTS visitors_dump (
    id              BIGINT,
    event_id        BIGINT,
    entry_code      STRING,
    name            STRING,
    is_active       BOOLEAN,
    created_at      STRING,
    updated_at      STRING
)
ROW FORMAT DELIMITED
    FIELDS TERMINATED BY '\t'
    LINES TERMINATED BY '\n'
STORED AS TEXTFILE
LOCATION 'hdfs://namenode:9000/data/db_dump/visitors';

CREATE EXTERNAL TABLE IF NOT EXISTS booth_goods_dump (
    id              BIGINT,
    booth_id        BIGINT,
    name            STRING,
    image_path      STRING,
    is_sold_out     BOOLEAN,
    created_at      STRING,
    updated_at      STRING
)
ROW FORMAT DELIMITED
    FIELDS TERMINATED BY '\t'
    LINES TERMINATED BY '\n'
STORED AS TEXTFILE
LOCATION 'hdfs://namenode:9000/data/db_dump/booth_goods';
