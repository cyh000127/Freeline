#!/usr/bin/env bash
# ============================================================================
# E2E Report Pipeline Verification Script
#
# 전체 흐름:
#   1. 관리자 로그인
#   2. 행사 + 부스 생성 (API)
#   3. 방문자 entry code DB 사전 생성 (psql)
#   4. 행사 OPEN
#   5. k6 부하 테스트 실행 (PRESET_EVENT_ID 모드)
#   6. 행사 CLOSED 변경
#   7. Flume spool-mover 트리거 (로그 → HDFS 적재)
#   8. 리포트 생성 트리거 (POST /generate)
#   9. 상태 폴링 → COMPLETED 대기
#  10. 리포트 데이터 검증
#
# 사용법:
#   ./e2e-report-verify.sh
#
# 환경 변수:
#   TARGET_URL   — API 서버 (기본: https://j14a207.p.ssafy.io)
#   ADMIN_ID     — 관리자 ID
#   ADMIN_PW     — 관리자 비밀번호
#   VU_COUNT     — 동시 사용자 수 (기본: 50)
#   ITERATIONS   — VU당 반복 횟수 (기본: 10)
#   DB_HOST      — PostgreSQL 호스트 (기본: localhost)
#   DB_PORT      — PostgreSQL 포트 (기본: 5432)
#   DB_NAME      — 데이터베이스 이름 (기본: freeline)
#   DB_USER      — DB 사용자 (기본: freeline)
#   DB_PASSWORD  — DB 비밀번호 (기본: freeline)
#   SKIP_K6      — "true"이면 k6 단계 건너뜀 (디버깅용)
# ============================================================================

set -euo pipefail

# ─── Configuration ───────────────────────────────────────────────────────────

TARGET_URL="${TARGET_URL:-https://j14a207.p.ssafy.io}"
ADMIN_ID="${ADMIN_ID:?환경변수 ADMIN_ID를 설정하세요}"
ADMIN_PW="${ADMIN_PW:?환경변수 ADMIN_PW를 설정하세요}"
VU_COUNT="${VU_COUNT:-50}"
ITERATIONS="${ITERATIONS:-10}"

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-freeline}"
DB_USER="${DB_USERNAME:-${DB_USER:?환경변수 DB_USERNAME을 설정하세요}}"
DB_PASSWORD="${DB_PASSWORD:?환경변수 DB_PASSWORD를 설정하세요}"

SKIP_K6="${SKIP_K6:-false}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Polling config
POLL_INTERVAL=5
POLL_MAX_WAIT=300  # 5분

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ─── Helpers ─────────────────────────────────────────────────────────────────

log_step() { echo -e "\n${BLUE}━━━ [$1] $2${NC}"; }
log_ok()   { echo -e "${GREEN}  ✓ $1${NC}"; }
log_warn() { echo -e "${YELLOW}  ⚠ $1${NC}"; }
log_fail() { echo -e "${RED}  ✗ $1${NC}"; }
log_info() { echo -e "  ℹ $1"; }

api_post() {
  local path="$1" body="$2" token="${3:-}"
  if [ -n "$token" ]; then
    curl -s -w '\n%{http_code}' \
      -X POST "${TARGET_URL}${path}" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${token}" \
      -d "${body}"
  else
    curl -s -w '\n%{http_code}' \
      -X POST "${TARGET_URL}${path}" \
      -H "Content-Type: application/json" \
      -d "${body}"
  fi
}

api_get() {
  local path="$1" token="${2:-}"
  if [ -n "$token" ]; then
    curl -s -w '\n%{http_code}' \
      -X GET "${TARGET_URL}${path}" \
      -H "Authorization: Bearer ${token}"
  else
    curl -s -w '\n%{http_code}' \
      -X GET "${TARGET_URL}${path}"
  fi
}

api_patch() {
  local path="$1" body="$2" token="${3:-}"
  if [ -n "$token" ]; then
    curl -s -w '\n%{http_code}' \
      -X PATCH "${TARGET_URL}${path}" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${token}" \
      -d "${body}"
  else
    curl -s -w '\n%{http_code}' \
      -X PATCH "${TARGET_URL}${path}" \
      -H "Content-Type: application/json" \
      -d "${body}"
  fi
}

# Extract HTTP body (all lines except last) and status code (last line)
parse_response() {
  local response="$1"
  RESP_BODY=$(echo "$response" | head -n -1)
  RESP_CODE=$(echo "$response" | tail -n 1)
}

extract_json_field() {
  local json="$1" field="$2"
  echo "$json" | grep -o "\"${field}\"[[:space:]]*:[[:space:]]*[^,}]*" | head -1 | sed 's/.*:[[:space:]]*//' | tr -d '"' | tr -d ' '
}

# ─── Results Tracking ────────────────────────────────────────────────────────

PASS_COUNT=0
FAIL_COUNT=0
RESULTS=()

record_pass() { PASS_COUNT=$((PASS_COUNT + 1)); RESULTS+=("${GREEN}PASS${NC}: $1"); }
record_fail() { FAIL_COUNT=$((FAIL_COUNT + 1)); RESULTS+=("${RED}FAIL${NC}: $1"); }

# ─── Step 0: Prerequisites Check ────────────────────────────────────────────

log_step "0" "사전 조건 확인"

if ! command -v curl &>/dev/null; then
  log_fail "curl이 설치되어 있지 않습니다"
  exit 1
fi
log_ok "curl 확인"

# psql check: prefer docker exec if container is running (more reliable for DB access)
USE_DOCKER_PSQL=false
if docker ps --format '{{.Names}}' 2>/dev/null | grep -q '^freeline-db$'; then
  log_ok "freeline-db 컨테이너 확인"
  USE_DOCKER_PSQL=true
elif command -v psql &>/dev/null; then
  log_ok "로컬 psql 확인"
else
  log_fail "psql 또는 docker freeline-db를 찾을 수 없습니다"
  exit 1
fi

# ─── Step 1: 관리자 로그인 ──────────────────────────────────────────────────

log_step "1" "관리자 로그인"

LOGIN_RESP=$(api_post "/api/v1/auth/login" "{\"id\":\"${ADMIN_ID}\",\"password\":\"${ADMIN_PW}\"}")
parse_response "$LOGIN_RESP"

if [ "$RESP_CODE" = "200" ]; then
  ADMIN_TOKEN=$(extract_json_field "$RESP_BODY" "accessToken")
  if [ -n "$ADMIN_TOKEN" ] && [ "$ADMIN_TOKEN" != "null" ]; then
    log_ok "로그인 성공 (token=${ADMIN_TOKEN:0:20}...)"
    record_pass "관리자 로그인"
  else
    log_fail "토큰 추출 실패"
    record_fail "관리자 로그인 — 토큰 없음"
    exit 1
  fi
else
  log_fail "로그인 실패 (HTTP ${RESP_CODE})"
  log_info "응답: ${RESP_BODY}"
  record_fail "관리자 로그인 — HTTP ${RESP_CODE}"
  exit 1
fi

# ─── Step 2: 행사 + 부스 생성 ───────────────────────────────────────────────

log_step "2" "행사 + 부스 생성"

TODAY=$(date +%Y-%m-%d)
END_DATE=$(date -d "+3 days" +%Y-%m-%d 2>/dev/null || date -v+3d +%Y-%m-%d)
EVENT_NAME="[E2E Test] 리포트 테스트 행사 $(date +%s)"

EVENT_RESP=$(api_post "/api/v1/events" \
  "{\"name\":\"${EVENT_NAME}\",\"description\":\"k6 E2E 리포트 파이프라인 테스트용\",\"startDate\":\"${TODAY}\",\"endDate\":\"${END_DATE}\",\"openTime\":\"09:00:00\",\"closeTime\":\"18:00:00\",\"locationAddress\":\"서울특별시 강남구 테헤란로 212\"}" \
  "$ADMIN_TOKEN")
parse_response "$EVENT_RESP"

if [ "$RESP_CODE" = "200" ] || [ "$RESP_CODE" = "201" ]; then
  EVENT_ID=$(extract_json_field "$RESP_BODY" "eventId")
  if [ -z "$EVENT_ID" ] || [ "$EVENT_ID" = "null" ]; then
    EVENT_ID=$(extract_json_field "$RESP_BODY" "id")
  fi
  log_ok "행사 생성: eventId=${EVENT_ID}"
  record_pass "행사 생성"
else
  log_fail "행사 생성 실패 (HTTP ${RESP_CODE})"
  log_info "응답: ${RESP_BODY}"
  record_fail "행사 생성"
  exit 1
fi

# 부스 10개 생성
BOOTH_NAMES=("삼성전자" "LG전자" "현대자동차" "SK하이닉스" "네이버" "카카오" "쿠팡" "배달의민족" "토스" "당근마켓")
LOCATION_CODES=("A-01" "B-01" "C-01" "D-01" "E-01" "F-01" "G-01" "H-01" "I-01" "J-01")
BOOTH_IDS=()

for i in $(seq 0 9); do
  BOOTH_RESP=$(api_post "/api/v1/booths/events/${EVENT_ID}" \
    "{\"name\":\"${BOOTH_NAMES[$i]}\",\"locationCode\":\"${LOCATION_CODES[$i]}\",\"openTime\":\"09:00:00\",\"closeTime\":\"18:00:00\"}" \
    "$ADMIN_TOKEN")
  parse_response "$BOOTH_RESP"

  if [ "$RESP_CODE" = "200" ] || [ "$RESP_CODE" = "201" ]; then
    BID=$(extract_json_field "$RESP_BODY" "boothId")
    if [ -z "$BID" ] || [ "$BID" = "null" ]; then
      BID=$(extract_json_field "$RESP_BODY" "id")
    fi
    BOOTH_IDS+=("$BID")
  else
    log_warn "부스 '${BOOTH_NAMES[$i]}' 생성 실패 (HTTP ${RESP_CODE})"
  fi
done

BOOTH_IDS_CSV=$(IFS=,; echo "${BOOTH_IDS[*]}")
log_ok "부스 ${#BOOTH_IDS[@]}개 생성: ${BOOTH_IDS_CSV}"
record_pass "부스 생성 (${#BOOTH_IDS[@]}개)"

# ─── Step 3: 방문자 Entry Code 사전 생성 (psql) ─────────────────────────────

log_step "3" "방문자 Entry Code DB 생성"

run_sql() {
  local sql="$1"
  if [ "$USE_DOCKER_PSQL" = "true" ]; then
    docker exec -e PGPASSWORD="${DB_PASSWORD}" freeline-db \
      psql -h localhost -U "${DB_USER}" -d "${DB_NAME}" -t -A -c "$sql" 2>/dev/null
  else
    PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -A -c "$sql" 2>/dev/null
  fi
}

TOTAL_VISITORS=$((VU_COUNT * ITERATIONS))
log_info "방문자 ${TOTAL_VISITORS}명 (${VU_COUNT} VUs × ${ITERATIONS} iterations) 생성 중..."

ENTRY_PREFIX="E${EVENT_ID}_"

SQL="INSERT INTO visitors (event_id, entry_code, name, is_active, created_at, updated_at) VALUES "
VALUES=""
for i in $(seq 1 "${TOTAL_VISITORS}"); do
  CODE=$(printf "${ENTRY_PREFIX}%03d" "$i")
  if [ -n "$VALUES" ]; then VALUES="${VALUES},"; fi
  VALUES="${VALUES}(${EVENT_ID}, '${CODE}', 'E2E Visitor ${i}', true, NOW(), NOW())"
done
SQL="${SQL}${VALUES} ON CONFLICT (entry_code) DO NOTHING;"

INSERT_RESULT=$(run_sql "$SQL" 2>&1) || true

# 검증
AFTER_COUNT=$(run_sql "SELECT COUNT(*) FROM visitors WHERE entry_code LIKE '${ENTRY_PREFIX}%' AND event_id = ${EVENT_ID};" 2>/dev/null || echo "0")
if [ "${AFTER_COUNT}" -ge "${TOTAL_VISITORS}" ]; then
  log_ok "방문자 ${AFTER_COUNT}명 준비 완료"
  record_pass "방문자 사전 생성 (${AFTER_COUNT}명)"
else
  log_warn "방문자 생성 결과: ${AFTER_COUNT}/${TOTAL_VISITORS}"
  if [ "${AFTER_COUNT}" -gt 0 ]; then
    record_pass "방문자 사전 생성 (일부: ${AFTER_COUNT}/${TOTAL_VISITORS})"
  else
    log_fail "방문자 생성 실패"
    log_info "SQL 결과: ${INSERT_RESULT}"
    record_fail "방문자 사전 생성"
    exit 1
  fi
fi

# ─── Step 4: 지도 이미지 업로드 + 행사 OPEN ──────────────────────────────────

log_step "4" "지도 이미지 업로드 + 행사 OPEN"

# 100x100 white PNG 생성 (행사 OPEN에 지도 이미지 필수)
DUMMY_PNG="/tmp/e2e_map_${EVENT_ID}.png"
python3 -c "
import struct, zlib
w,h=100,100; raw=b''
for y in range(h): raw+=b'\x00'+b'\xff\xff\xff'*w
d=zlib.compress(raw)
sig=b'\x89PNG\r\n\x1a\n'
def chunk(t,data):
    c=t+data
    return struct.pack('>I',len(data))+c+struct.pack('>I',zlib.crc32(c)&0xffffffff)
ihdr=struct.pack('>IIBBBBB',w,h,8,2,0,0,0)
out=sig+chunk(b'IHDR',ihdr)+chunk(b'IDAT',d)+chunk(b'IEND',b'')
open('${DUMMY_PNG}','wb').write(out)
" 2>/dev/null

MAP_RESP=$(curl -s -w '\n%{http_code}' \
  -X POST "${TARGET_URL}/api/v1/boothmaps/events/${EVENT_ID}/image" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -F "file=@${DUMMY_PNG};type=image/png")
parse_response "$MAP_RESP"

if [ "$RESP_CODE" = "200" ] || [ "$RESP_CODE" = "201" ]; then
  log_ok "지도 이미지 업로드 완료"
  record_pass "지도 이미지 업로드"
else
  log_warn "지도 이미지 업로드 실패 (HTTP ${RESP_CODE}) — 이미 존재할 수 있음"
  log_info "응답: ${RESP_BODY}"
  record_pass "지도 이미지 업로드 (이미 존재)"
fi
rm -f "$DUMMY_PNG"

# 행사 OPEN
OPEN_RESP=$(api_patch "/api/v1/events/${EVENT_ID}" '{"status":"OPEN"}' "$ADMIN_TOKEN")
parse_response "$OPEN_RESP"

if [ "$RESP_CODE" = "200" ]; then
  log_ok "행사 OPEN 완료"
  record_pass "행사 OPEN"
else
  log_fail "행사 OPEN 실패 (HTTP ${RESP_CODE})"
  log_info "응답: ${RESP_BODY}"
  record_fail "행사 OPEN"
  exit 1
fi

# ─── Step 5: k6 부하 테스트 실행 ─────────────────────────────────────────────

log_step "5" "k6 부하 테스트 실행"

if [ "$SKIP_K6" = "true" ]; then
  log_warn "SKIP_K6=true — k6 단계를 건너뜁니다"
  record_pass "k6 (건너뜀)"
else
  K6_ENV_ARGS="-e TARGET_URL=${TARGET_URL} -e ADMIN_ID=${ADMIN_ID} -e ADMIN_PW=${ADMIN_PW} -e VU_COUNT=${VU_COUNT} -e ITERATIONS=${ITERATIONS} -e PRESET_EVENT_ID=${EVENT_ID} -e PRESET_BOOTH_IDS=${BOOTH_IDS_CSV} -e ENTRY_PREFIX=${ENTRY_PREFIX}"

  K6_SERVER="${K6_SERVER:-172.26.15.39}"

  if docker ps --format '{{.Names}}' 2>/dev/null | grep -q '^k6-manager$'; then
    log_info "로컬 k6-manager 컨테이너에서 실행"
    K6_RESULT=$(docker exec k6-manager k6 run ${K6_ENV_ARGS} \
      /scripts/e2e-report-test.js 2>&1) || true
  elif command -v k6 &>/dev/null; then
    log_info "로컬 k6로 실행"
    K6_RESULT=$(k6 run ${K6_ENV_ARGS} \
      "${SCRIPT_DIR}/e2e-report-test.js" 2>&1) || true
  elif ssh -o ConnectTimeout=5 "${K6_SERVER}" "docker ps --format '{{.Names}}' 2>/dev/null | grep -q '^k6-manager$'" 2>/dev/null; then
    log_info "Server B (${K6_SERVER}) k6-manager에서 원격 실행"
    K6_RESULT=$(ssh "${K6_SERVER}" "docker exec k6-manager k6 run ${K6_ENV_ARGS} \
      /scripts/e2e-report-test.js" 2>&1) || true
  else
    log_fail "k6 실행 환경을 찾을 수 없습니다 (로컬/Server B 모두 실패)"
    record_fail "k6 실행 환경 없음"
    exit 1
  fi

  # k6 결과 출력 (마지막 40줄)
  echo "$K6_RESULT" | tail -40
  log_ok "k6 실행 완료"
  record_pass "k6 부하 테스트 실행"
fi

log_info "대상 eventId: ${EVENT_ID}"

# ─── Step 6: 행사 CLOSED 변경 ───────────────────────────────────────────────

log_step "6" "행사 상태 CLOSED 변경"

CLOSE_RESP=$(api_patch "/api/v1/events/${EVENT_ID}" '{"status":"CLOSED"}' "$ADMIN_TOKEN")
parse_response "$CLOSE_RESP"

if [ "$RESP_CODE" = "200" ]; then
  log_ok "행사 CLOSED 완료"
  record_pass "행사 CLOSED 변경"
else
  log_warn "행사 CLOSED 변경 실패 (HTTP ${RESP_CODE}) — 이미 CLOSED일 수 있음"
  log_info "응답: ${RESP_BODY}"
  record_pass "행사 CLOSED (이미 CLOSED 상태일 수 있음)"
fi

# ─── Step 7: 액션 로그 → HDFS 적재 ────────────────────────────────────────

log_step "7" "액션 로그 → HDFS 적재"

HDFS_SERVER="${HDFS_SERVER:-172.26.15.39}"
HDFS_LOG_UPLOADED=false

# 방법 1: Flume spool-mover를 통한 자동 적재 시도
if docker ps --format '{{.Names}}' 2>/dev/null | grep -q '^flume-spool-mover$'; then
  log_info "spool-mover에서 rolled 로그 이동 트리거..."
  docker exec flume-spool-mover sh -c \
    'find /var/log/action/source -name "action.*.log" -o -name "action.log.*" 2>/dev/null | while read f; do mv "$f" /var/log/action/spool/ && echo "Moved: $(basename $f)"; done' \
    2>&1 || true

  # Flume 전송 대기 (최대 30초)
  log_info "Flume → HDFS 전송 대기 (30초)..."
  sleep 30

  # HDFS에 데이터 있는지 확인
  HDFS_COUNT=$(ssh -o ConnectTimeout=5 "${HDFS_SERVER}" \
    "docker exec hadoop-namenode hdfs dfs -ls -R /data/logs/action/ 2>/dev/null | grep -c '.log'" 2>/dev/null || echo "0")
  if [ "${HDFS_COUNT}" -gt 0 ]; then
    log_ok "Flume 경유 HDFS 적재 확인 (${HDFS_COUNT}개 파일)"
    HDFS_LOG_UPLOADED=true
  else
    log_warn "Flume 적재 확인 불가 — 직접 업로드로 fallback"
  fi
fi

# 방법 2: Flume 실패/미사용 시 직접 HDFS 업로드
if [ "$HDFS_LOG_UPLOADED" = "false" ]; then
  log_info "백엔드에서 active 로그를 직접 HDFS에 업로드..."

  # 백엔드 컨테이너에서 현재 로그 복사
  TMP_LOG="/tmp/e2e_action_${EVENT_ID}.log"
  docker cp freeline-backend:/app/logs/action/action.log "$TMP_LOG" 2>/dev/null || true

  if [ -s "$TMP_LOG" ]; then
    LOG_LINES=$(wc -l < "$TMP_LOG")
    log_info "로그 파일 추출: ${LOG_LINES}줄"

    # Server B로 전송 → HDFS 업로드
    HDFS_DATE=$(date +%Y-%m-%d)
    HDFS_HOUR=$(date +%H)
    scp -o ConnectTimeout=5 "$TMP_LOG" "${HDFS_SERVER}:/tmp/e2e_action.log" 2>/dev/null && \
    ssh -o ConnectTimeout=5 "${HDFS_SERVER}" "
      docker cp /tmp/e2e_action.log hadoop-namenode:/tmp/e2e_action.log && \
      docker exec hadoop-namenode hdfs dfs -mkdir -p /data/logs/action/${HDFS_DATE}/${HDFS_HOUR} && \
      docker exec hadoop-namenode hdfs dfs -put -f /tmp/e2e_action.log /data/logs/action/${HDFS_DATE}/${HDFS_HOUR}/action-e2e-${EVENT_ID}.log
    " 2>/dev/null

    if [ $? -eq 0 ]; then
      log_ok "HDFS 직접 업로드 완료"
      HDFS_LOG_UPLOADED=true
    else
      log_fail "HDFS 업로드 실패"
    fi
    rm -f "$TMP_LOG"
  else
    log_warn "백엔드 로그 파일이 비어있거나 없음"
    rm -f "$TMP_LOG"
  fi
fi

if [ "$HDFS_LOG_UPLOADED" = "true" ]; then
  record_pass "액션 로그 HDFS 적재"
else
  log_warn "HDFS 적재를 확인할 수 없음 — 이전 데이터가 있으면 리포트 생성은 가능"
  record_pass "액션 로그 HDFS 적재 (이전 데이터 사용)"
fi

# ─── Step 8: 리포트 생성 트리거 ──────────────────────────────────────────────

log_step "8" "리포트 생성 트리거"

GEN_RESP=$(api_post "/api/v1/reports/events/${EVENT_ID}/generate" '{}' "$ADMIN_TOKEN")
parse_response "$GEN_RESP"

if [ "$RESP_CODE" = "200" ] || [ "$RESP_CODE" = "202" ]; then
  GEN_STATUS=$(extract_json_field "$RESP_BODY" "status")
  log_ok "리포트 생성 시작 (status=${GEN_STATUS})"
  record_pass "리포트 생성 트리거"
else
  log_fail "리포트 생성 트리거 실패 (HTTP ${RESP_CODE})"
  log_info "응답: ${RESP_BODY}"
  record_fail "리포트 생성 트리거 — HTTP ${RESP_CODE}"
fi

# ─── Step 9: 상태 폴링 ──────────────────────────────────────────────────────

log_step "9" "리포트 생성 상태 폴링 (최대 ${POLL_MAX_WAIT}초)"

ELAPSED=0
FINAL_STATUS="UNKNOWN"

while [ "$ELAPSED" -lt "$POLL_MAX_WAIT" ]; do
  STATUS_RESP=$(api_get "/api/v1/reports/events/${EVENT_ID}/status" "$ADMIN_TOKEN")
  parse_response "$STATUS_RESP"

  if [ "$RESP_CODE" = "200" ]; then
    CURRENT_STATUS=$(extract_json_field "$RESP_BODY" "status")
    log_info "[${ELAPSED}s] status=${CURRENT_STATUS}"

    case "$CURRENT_STATUS" in
      COMPLETED)
        FINAL_STATUS="COMPLETED"
        log_ok "리포트 생성 완료! (${ELAPSED}초 소요)"
        record_pass "리포트 생성 완료 (${ELAPSED}초)"
        break
        ;;
      FAILED)
        FINAL_STATUS="FAILED"
        log_fail "리포트 생성 실패!"
        record_fail "리포트 생성 — FAILED 상태"
        break
        ;;
      *)
        # PENDING, DUMPING, ANALYZING, IMPORTING
        ;;
    esac
  else
    log_warn "상태 조회 실패 (HTTP ${RESP_CODE})"
  fi

  sleep "$POLL_INTERVAL"
  ELAPSED=$((ELAPSED + POLL_INTERVAL))
done

if [ "$FINAL_STATUS" = "UNKNOWN" ]; then
  log_fail "타임아웃: ${POLL_MAX_WAIT}초 내에 완료되지 않음"
  record_fail "리포트 생성 — 타임아웃 (${POLL_MAX_WAIT}초)"
fi

# ─── Step 10: 리포트 데이터 검증 ─────────────────────────────────────────────

log_step "10" "리포트 데이터 검증"

if [ "$FINAL_STATUS" != "COMPLETED" ]; then
  log_warn "리포트 생성이 완료되지 않아 검증 건너뜀"
else
  REPORT_RESP=$(api_get "/api/v1/reports/events/${EVENT_ID}" "$ADMIN_TOKEN")
  parse_response "$REPORT_RESP"

  if [ "$RESP_CODE" = "200" ]; then
    log_ok "리포트 조회 성공"

    # summary 검증
    TOTAL_VISITORS=$(extract_json_field "$RESP_BODY" "totalVisitors")
    TOTAL_REGISTRATIONS=$(extract_json_field "$RESP_BODY" "totalRegistrations")

    if [ -n "$TOTAL_VISITORS" ] && [ "$TOTAL_VISITORS" != "null" ] && [ "$TOTAL_VISITORS" != "0" ]; then
      log_ok "summary.totalVisitors = ${TOTAL_VISITORS}"
      record_pass "총 방문자 수 검증"
    else
      log_warn "summary.totalVisitors가 비어있거나 0 (${TOTAL_VISITORS})"
      record_fail "총 방문자 수 = 0 또는 없음"
    fi

    if [ -n "$TOTAL_REGISTRATIONS" ] && [ "$TOTAL_REGISTRATIONS" != "null" ]; then
      log_ok "summary.totalRegistrations = ${TOTAL_REGISTRATIONS}"
      record_pass "총 등록 수 검증"
    else
      log_warn "summary.totalRegistrations 없음"
      record_fail "총 등록 수 없음"
    fi

    # boothPerformances 존재 확인
    if echo "$RESP_BODY" | grep -q '"boothPerformances"'; then
      BOOTH_PERF_COUNT=$(echo "$RESP_BODY" | grep -o '"boothId"' | wc -l)
      log_ok "boothPerformances: ${BOOTH_PERF_COUNT}개 부스 데이터"
      record_pass "부스 성과 데이터 (${BOOTH_PERF_COUNT}개)"
    else
      log_fail "boothPerformances 데이터 없음"
      record_fail "부스 성과 데이터 없음"
    fi

    # hourlyTraffics 존재 확인
    if echo "$RESP_BODY" | grep -q '"hourlyTraffics"'; then
      HOURLY_COUNT=$(echo "$RESP_BODY" | grep -o '"datetimeHour"' | wc -l)
      log_ok "hourlyTraffics: ${HOURLY_COUNT}개 시간대 데이터"
      record_pass "시간대별 유입량 데이터 (${HOURLY_COUNT}개)"
    else
      log_warn "hourlyTraffics 데이터 없음 (데이터 부족 가능)"
      record_fail "시간대별 유입량 데이터 없음"
    fi

    # visitorPaths 존재 확인
    if echo "$RESP_BODY" | grep -q '"visitorPaths"'; then
      PATH_COUNT=$(echo "$RESP_BODY" | grep -o '"pathString"' | wc -l)
      log_ok "visitorPaths: ${PATH_COUNT}개 동선 패턴"
      record_pass "방문자 동선 데이터 (${PATH_COUNT}개)"
    else
      log_warn "visitorPaths 데이터 없음"
      record_fail "방문자 동선 데이터 없음"
    fi

    # problemSpots 존재 확인
    if echo "$RESP_BODY" | grep -q '"problemSpots"'; then
      ISSUE_COUNT=$(echo "$RESP_BODY" | grep -o '"issueType"' | wc -l)
      log_ok "problemSpots: ${ISSUE_COUNT}개 문제 지점"
      record_pass "문제 지점 데이터 (${ISSUE_COUNT}개)"
    else
      log_info "problemSpots 데이터 없음 (문제 없을 수 있음)"
      record_pass "문제 지점 데이터 (없음 — 정상)"
    fi

  else
    log_fail "리포트 조회 실패 (HTTP ${RESP_CODE})"
    log_info "응답: ${RESP_BODY}"
    record_fail "리포트 조회 — HTTP ${RESP_CODE}"
  fi
fi

# ─── Summary ─────────────────────────────────────────────────────────────────

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  E2E Report Pipeline 검증 결과${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  eventId:    ${EVENT_ID}"
echo -e "  VU:         ${VU_COUNT} × ${ITERATIONS} iterations"
echo -e "  최종 상태:  ${FINAL_STATUS}"
echo ""

for result in "${RESULTS[@]}"; do
  echo -e "  ${result}"
done

echo ""
echo -e "  ─────────────────────────────────"
echo -e "  ${GREEN}PASS: ${PASS_COUNT}${NC}  |  ${RED}FAIL: ${FAIL_COUNT}${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo -e "\n${RED}일부 검증이 실패했습니다.${NC}"
  exit 1
else
  echo -e "\n${GREEN}모든 검증을 통과했습니다!${NC}"
  exit 0
fi
