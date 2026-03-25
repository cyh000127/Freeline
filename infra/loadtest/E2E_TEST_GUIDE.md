# E2E 리포트 파이프라인 테스트 가이드

## 개요

행사 생성부터 Hadoop 배치 분석 리포트 생성까지의 전체 파이프라인을 검증하는 테스트입니다.

```
[행사/부스 생성] → [방문자 시뮬레이션 (k6)] → [액션 로그 수집]
    → [Flume → HDFS 적재] → [Hive 배치 분석] → [PostgreSQL 리포트 적재]
    → [리포트 API 조회/검증]
```

## 아키텍처

| 서버 | 역할 | 주요 컴포넌트 |
|------|------|--------------|
| **Server A** (172.26.3.239) | 애플리케이션 | Backend, PostgreSQL, Redis, RabbitMQ, Flume Agent, Nginx |
| **Server B** (172.26.15.39) | 데이터/인프라 | Hadoop (HDFS+YARN), Hive, k6, Jenkins, Prometheus+Grafana |

## 전제 조건

### 인프라 상태 확인

```bash
# Server A: 백엔드 + Flume 확인
curl -s http://localhost:8080/actuator/health
docker ps --format '{{.Names}}' | grep -E 'freeline-backend|flume'

# Server B: Hadoop + Hive + k6 확인
ssh 172.26.15.39 'docker ps --format "{{.Names}}" | grep -E "namenode|hive-server|k6"'
```

### Hive 테이블 초기화 (최초 1회)

Hadoop 컨테이너 재기동 후에는 Hive 데이터베이스/테이블이 초기화되므로 다시 생성해야 합니다.

```bash
# 소스 테이블 (init-hive.sql)
ssh 172.26.15.39 'docker exec hive-server beeline \
  -u "jdbc:hive2://localhost:10000" \
  -f /scripts/init-hive.sql'

# 결과 테이블 (수동 생성 필요)
ssh 172.26.15.39 'docker exec hive-server beeline \
  -u "jdbc:hive2://localhost:10000/freeline" -e "
CREATE TABLE IF NOT EXISTS booth_performance_result (
    event_id BIGINT, booth_id BIGINT, booth_name STRING,
    view_count BIGINT, register_count BIGINT, dropout_count BIGINT,
    conversion_rate DOUBLE, dropout_rate DOUBLE, analyzed_at STRING
);
CREATE TABLE IF NOT EXISTS hourly_traffic_result (
    event_id BIGINT, datetime_hour STRING, active_user_count BIGINT,
    register_count BIGINT, analyzed_at STRING
);
CREATE TABLE IF NOT EXISTS visitor_path_result (
    event_id BIGINT, path_string STRING, visitor_count BIGINT, analyzed_at STRING
);
CREATE TABLE IF NOT EXISTS problem_spots_result (
    event_id BIGINT, issue_type STRING, target_id STRING, target_name STRING,
    severity STRING, issue_metric DOUBLE, description STRING, analyzed_at STRING
);
CREATE TABLE IF NOT EXISTS event_summary_result (
    event_id BIGINT, total_visitors BIGINT, total_registrations BIGINT,
    avg_waiting_seconds DOUBLE, overall_dropout_rate DOUBLE,
    peak_hour STRING, analyzed_at STRING
);
"'
```

## 테스트 방법

### 방법 1: 자동 오케스트레이션 스크립트 (e2e-report-verify.sh)

전체 파이프라인을 하나의 스크립트로 실행합니다.

```bash
# Server A에서 실행
cd /home/ubuntu/S14P21A207/infra/loadtest/scripts

# 기본 실행 (VU 50명, 10회 반복)
DB_USER=freeline_admin \
DB_PASSWORD=AtIDZFMV20ARA747nyOSBjtFNuIfMbIa \
./e2e-report-verify.sh

# 가볍게 실행 (VU 5명, 2회)
VU_COUNT=5 ITERATIONS=2 \
DB_USER=freeline_admin \
DB_PASSWORD=AtIDZFMV20ARA747nyOSBjtFNuIfMbIa \
./e2e-report-verify.sh
```

**스크립트 실행 단계:**
1. 관리자 로그인
2. 행사 + 부스 10개 생성 (API)
3. 방문자 entry code DB 사전 생성 (psql)
4. 행사 OPEN
5. k6 부하 테스트 실행 (방문자 시뮬레이션)
6. 행사 CLOSED
7. Flume spool-mover 트리거
8. 리포트 생성 API 호출
9. 상태 폴링 (COMPLETED 대기, 최대 5분)
10. 리포트 데이터 검증

**환경 변수:**

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `TARGET_URL` | `https://j14a207.p.ssafy.io` | API 서버 URL |
| `ADMIN_ID` | `kangseunghun9927@gmail.com` | 관리자 로그인 ID |
| `ADMIN_PW` | `jmh8EYG3pyd9ydt*vam` | 관리자 비밀번호 |
| `VU_COUNT` | `50` | 동시 가상 사용자 수 |
| `ITERATIONS` | `10` | VU당 반복 횟수 |
| `DB_USER` | `freeline` | PostgreSQL 사용자 |
| `DB_PASSWORD` | `freeline` | PostgreSQL 비밀번호 |
| `SKIP_K6` | `false` | `true` 시 k6 단계 건너뜀 |

### 방법 2: 단계별 수동 실행

각 단계를 개별적으로 실행하여 디버깅하거나 특정 단계만 테스트할 때 사용합니다.

#### Step 1: 관리자 로그인

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"id":"kangseunghun9927@gmail.com","password":"jmh8EYG3pyd9ydt*vam"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")
echo "Token: ${TOKEN:0:30}..."
```

#### Step 2: 행사 + 부스 생성

```bash
# 행사 생성
curl -s -X POST http://localhost:8080/api/v1/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"테스트 행사","description":"E2E 테스트","startDate":"2026-03-25","endDate":"2026-03-28","openTime":"09:00:00","closeTime":"18:00:00","locationAddress":"서울시 강남구"}'

# 부스 생성 (EVENT_ID 치환)
curl -s -X POST http://localhost:8080/api/v1/booths/events/{EVENT_ID} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"삼성전자","locationCode":"A-01","openTime":"09:00:00","closeTime":"18:00:00"}'
```

#### Step 3: 방문자 DB 생성

```bash
docker exec freeline-db psql -U freeline_admin -d freeline -c "
INSERT INTO visitors (event_id, entry_code, name, is_active, created_at, updated_at)
SELECT {EVENT_ID}, 'E2E' || LPAD(g::text, 3, '0'), 'Visitor ' || g, true, NOW(), NOW()
FROM generate_series(1, 5) g
ON CONFLICT (entry_code) DO NOTHING;"
```

#### Step 4: 행사 OPEN

행사 OPEN에는 지도 이미지가 필요합니다.

```bash
# 더미 지도 이미지 업로드 (100x100 PNG)
python3 -c "
import struct, zlib, base64
def png():
    w,h=100,100; raw=b'';
    for y in range(h): raw+=b'\x00'+b'\xff\xff\xff'*w
    d=zlib.compress(raw)
    sig=b'\x89PNG\r\n\x1a\n'
    ihdr=struct.pack('>IIHBI',w,h,8,2,0)
    c1=b'IHDR'+ihdr; c2=b'IDAT'+d; c3=b'IEND'
    def chunk(d): return struct.pack('>I',len(d)-4)+d+struct.pack('>I',zlib.crc32(d)&0xffffffff)
    return sig+chunk(c1)+chunk(c2)+chunk(c3)
open('/tmp/map.png','wb').write(png())" && \
curl -s -X POST "http://localhost:8080/api/v1/boothmaps/events/{EVENT_ID}/image" \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@/tmp/map.png"

# 행사 OPEN
curl -s -X PATCH "http://localhost:8080/api/v1/events/{EVENT_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status":"OPEN"}'
```

#### Step 5: k6 부하 테스트

```bash
# Server B의 k6-manager에서 실행
ssh 172.26.15.39 "docker exec k6-manager k6 run \
  -e TARGET_URL=https://j14a207.p.ssafy.io \
  -e PRESET_EVENT_ID={EVENT_ID} \
  -e PRESET_BOOTH_IDS={BOOTH_IDS} \
  -e VU_COUNT=5 \
  -e ITERATIONS=2 \
  /scripts/e2e-report-test.js"
```

#### Step 6: 행사 CLOSED

```bash
curl -s -X PATCH "http://localhost:8080/api/v1/events/{EVENT_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status":"CLOSED"}'
```

#### Step 7: 액션 로그 → HDFS

Flume이 정상 동작하면 자동으로 HDFS에 적재됩니다.
Flume이 동작하지 않는 경우 수동으로 적재합니다.

```bash
# Flume 동작 확인
docker logs flume-agent --tail 5

# 수동 적재 (Flume 미동작 시)
# 1. 백엔드 로그 파일 확인
docker exec freeline-backend ls -la /app/logs/action/

# 2. 로그 파일을 HDFS에 수동 업로드
docker exec freeline-backend cat /app/logs/action/action.log > /tmp/action.log
scp /tmp/action.log 172.26.15.39:/tmp/
ssh 172.26.15.39 'docker exec -i hadoop-namenode hdfs dfs -mkdir -p /data/logs/action/$(date +%Y-%m-%d)/$(date +%H) && \
  docker cp /tmp/action.log hadoop-namenode:/tmp/ && \
  docker exec hadoop-namenode hdfs dfs -put -f /tmp/action.log /data/logs/action/$(date +%Y-%m-%d)/$(date +%H)/'

# HDFS 적재 확인
ssh 172.26.15.39 'docker exec hadoop-namenode hdfs dfs -ls -R /data/logs/action/'
```

#### Step 8: 리포트 생성 트리거

```bash
curl -s -X POST "http://localhost:8080/api/v1/reports/events/{EVENT_ID}/generate" \
  -H "Authorization: Bearer $TOKEN"
```

#### Step 9: 상태 폴링

```bash
# 반복 확인 (15초 간격)
for i in $(seq 1 20); do
  STATUS=$(curl -s "http://localhost:8080/api/v1/reports/events/{EVENT_ID}/status" \
    -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['status'])")
  echo "[$i] $STATUS"
  [ "$STATUS" = "COMPLETED" ] || [ "$STATUS" = "FAILED" ] && break
  sleep 15
done
```

상태 전이: `PENDING → DUMPING → ANALYZING → IMPORTING → COMPLETED`

#### Step 10: 결과 검증

```bash
# API로 리포트 조회
curl -s "http://localhost:8080/api/v1/reports/events/{EVENT_ID}" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# DB 직접 확인
docker exec freeline-db psql -U freeline_admin -d freeline -c "
SELECT 'event_summary' as tbl, count(*) FROM event_summary_results WHERE event_id={EVENT_ID}
UNION ALL SELECT 'booth_perf', count(*) FROM booth_performance_results WHERE event_id={EVENT_ID}
UNION ALL SELECT 'hourly', count(*) FROM hourly_traffic_results WHERE event_id={EVENT_ID}
UNION ALL SELECT 'paths', count(*) FROM visitor_path_results WHERE event_id={EVENT_ID}
UNION ALL SELECT 'problems', count(*) FROM problem_spot_results WHERE event_id={EVENT_ID};"
```

## 자동화 수준 정리

| 단계 | 자동화 | 비고 |
|------|--------|------|
| 관리자 로그인 | **자동** | verify.sh / k6 setup |
| 행사/부스 생성 | **자동** | verify.sh / k6 setup |
| 방문자 DB 생성 | **자동** | verify.sh (psql/docker exec) |
| 지도 이미지 업로드 | **자동** | verify.sh (더미 PNG 자동 생성+업로드) |
| 행사 OPEN | **자동** | verify.sh |
| k6 부하 테스트 | **자동** | Server B k6-manager 또는 로컬 k6 |
| 행사 CLOSED | **자동** | verify.sh |
| 액션 로그 → HDFS | **자동** | Flume 우선 시도 + 직접 HDFS 업로드 fallback |
| 리포트 생성 | **자동** | API 호출 |
| 상태 폴링 | **자동** | verify.sh (최대 5분) |
| 결과 검증 | **자동** | verify.sh (API 응답 필드 존재 여부 확인) |

### 주의사항

1. **entry_code UNIQUE 제약** — 반복 실행 시 entry_code 충돌 가능. 행사별 prefix 사용 권장 (예: `E{eventId}_001`)
2. **Hive 결과 테이블** — Hadoop 재기동 후 수동 CREATE 필요 (위 "Hive 테이블 초기화" 참조)

## 시연용 데이터 셋업 (demo-setup.sh)

5~10분 시연에서 "행사 종료 → 분석 리포트 생성"을 라이브로 보여주기 위한 사전 데이터 준비 스크립트입니다.

```bash
# 기본: 행사 OPEN 상태로 준비 (시연자가 직접 CLOSED → 리포트 생성)
./scripts/demo-setup.sh

# 행사까지 CLOSED (시연자가 리포트 생성만 클릭)
./scripts/demo-setup.sh --auto-close

# 소규모
VU_COUNT=5 ITERATIONS=2 ./scripts/demo-setup.sh
```

**시연 흐름:**
1. 스크립트 실행 → 행사/부스/방문자 생성 + k6 시뮬레이션 + HDFS 적재
2. 관리자 대시보드에서 행사 선택
3. (OPEN 상태라면) 행사 종료
4. "분석 리포트 생성" 클릭
5. ~15초 대기 후 리포트 결과 확인

## 트러블슈팅

### Hive "Database freeline does not exist"

Hadoop 컨테이너 재기동 후 발생. init-hive.sql 재실행 + 결과 테이블 재생성 필요.

### HDFS WebHDFS 307 redirect 실패

백엔드에서 HDFS에 파일을 쓸 때 datanode 호스트명 해결 불가. `HdfsClient`의 `rewriteDatanodeHost`가 datanode 컨테이너 호스트명을 Server B IP로 치환합니다. `HDFS_WEBHDFS_URL` 환경변수가 올바르게 설정되어 있는지 확인.

### 리포트 상태가 계속 NOT_STARTED

백엔드 컨테이너가 재시작되면 in-memory `statusMap`이 초기화됩니다. 다시 generate API를 호출하세요.

### Hive 컬럼명 불일치

`HiveAnalysisService`(INSERT)와 `ReportImportService`(SELECT)에서 참조하는 컬럼명이 Hive 테이블과 일치해야 합니다. `DESCRIBE freeline.{table_name}`으로 실제 컬럼명 확인.

## 관련 파일

| 파일 | 역할 |
|------|------|
| `infra/loadtest/scripts/e2e-report-verify.sh` | 전체 파이프라인 오케스트레이션 스크립트 |
| `infra/loadtest/scripts/e2e-report-test.js` | k6 부하 테스트 (방문자 시뮬레이션) |
| `infra/hadoop/scripts/init-hive.sql` | Hive 소스 테이블 DDL |
| `be/.../report/service/ReportGenerationService.java` | 리포트 생성 오케스트레이터 |
| `be/.../report/service/DbDumpService.java` | DB → HDFS 덤프 |
| `be/.../report/service/HiveAnalysisService.java` | Hive 배치 분석 쿼리 |
| `be/.../report/service/ReportImportService.java` | Hive 결과 → PostgreSQL 적재 |
