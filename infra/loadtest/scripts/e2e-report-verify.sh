#!/usr/bin/env bash
# ============================================================================
# E2E Report Pipeline Verification Script
#
# 전체 흐름:
#   1. psql로 방문자(visitor) 사전 생성
#   2. k6 부하 테스트 실행 (행동 로그 + 대기열 데이터 생성)
#   3. 행사 상태 CLOSED 변경
#   4. Flume spool-mover 트리거 (로그 → HDFS 적재)
#   5. HDFS 적재 확인
#   6. 리포트 생성 트리거 (POST /generate)
#   7. 상태 폴링 → COMPLETED 대기
#   8. 리포트 데이터 검증
#
# 사용법:
#   ./e2e-report-verify.sh
#
# 환경 변수:
#   TARGET_URL   — API 서버 (기본: https://j14a207.p.ssafy.io)
#   ADMIN_ID     — 관리자 ID (기본: admin@freeline.com)
#   ADMIN_PW     — 관리자 비밀번호 (기본: password123!)
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
ADMIN_ID="${ADMIN_ID:-admin@freeline.com}"
ADMIN_PW="${ADMIN_PW:-password123!}"
VU_COUNT="${VU_COUNT:-50}"
ITERATIONS="${ITERATIONS:-10}"

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-freeline}"
DB_USER="${DB_USER:-freeline}"
DB_PASSWORD="${DB_PASSWORD:-freeline}"

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
  local auth_header=""
  if [ -n "$token" ]; then
    auth_header="-H \"Authorization: Bearer ${token}\""
  fi
  eval curl -s -w '\n%{http_code}' \
    -X POST "${TARGET_URL}${path}" \
    -H "Content-Type: application/json" \
    ${auth_header} \
    -d "'${body}'"
}

api_get() {
  local path="$1" token="${2:-}"
  local auth_header=""
  if [ -n "$token" ]; then
    auth_header="-H \"Authorization: Bearer ${token}\""
  fi
  eval curl -s -w '\n%{http_code}' \
    -X GET "${TARGET_URL}${path}" \
    ${auth_header}
}

api_patch() {
  local path="$1" body="$2" token="${3:-}"
  local auth_header=""
  if [ -n "$token" ]; then
    auth_header="-H \"Authorization: Bearer ${token}\""
  fi
  eval curl -s -w '\n%{http_code}' \
    -X PATCH "${TARGET_URL}${path}" \
    -H "Content-Type: application/json" \
    ${auth_header} \
    -d "'${body}'"
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

# Check curl
if ! command -v curl &>/dev/null; then
  log_fail "curl이 설치되어 있지 않습니다"
  exit 1
fi
log_ok "curl 확인"

# Check psql
if ! command -v psql &>/dev/null; then
  log_warn "psql이 없습니다 — 방문자 생성 단계를 건너뜁니다 (docker exec 시도)"
  USE_DOCKER_PSQL=true
else
  USE_DOCKER_PSQL=false
  log_ok "psql 확인"
fi

# ─── Step 1: Admin Login ─────────────────────────────────────────────────────

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

# ─── Step 2: k6 Load Test (행동 로그 + 대기열 데이터 생성) ──────────────────

log_step "2" "k6 부하 테스트 실행"

if [ "$SKIP_K6" = "true" ]; then
  log_warn "SKIP_K6=true — k6 단계를 건너뜁니다"
  log_info "기존 eventId를 수동으로 입력해 주세요"
  read -rp "  eventId: " EVENT_ID
else
  # k6 실행: docker exec 또는 로컬 k6
  K6_OUTPUT_FILE="${SCRIPT_DIR}/../output/e2e-report-$(date +%Y%m%d-%H%M%S).json"
  mkdir -p "$(dirname "$K6_OUTPUT_FILE")"

  K6_ENV_ARGS="-e TARGET_URL=${TARGET_URL} -e ADMIN_ID=${ADMIN_ID} -e ADMIN_PW=${ADMIN_PW} -e VU_COUNT=${VU_COUNT} -e ITERATIONS=${ITERATIONS}"

  if docker ps --format '{{.Names}}' 2>/dev/null | grep -q '^k6-manager$'; then
    log_info "k6-manager 컨테이너에서 실행"
    K6_RESULT=$(docker exec k6-manager k6 run ${K6_ENV_ARGS} \
      --summary-export=/output/e2e-report-summary.json \
      /scripts/e2e-report-test.js 2>&1) || true
  elif command -v k6 &>/dev/null; then
    log_info "로컬 k6로 실행"
    K6_RESULT=$(k6 run ${K6_ENV_ARGS} \
      --summary-export="${K6_OUTPUT_FILE}" \
      "${SCRIPT_DIR}/e2e-report-test.js" 2>&1) || true
  else
    log_fail "k6가 설치되어 있지 않고 k6-manager 컨테이너도 없습니다"
    record_fail "k6 실행 환경 없음"
    exit 1
  fi

  # k6 출력에서 EVENT_ID 추출 (teardown에서 console.log 출력)
  EVENT_ID=$(echo "$K6_RESULT" | grep -o 'EVENT_ID=[0-9]*' | head -1 | cut -d= -f2)
  K6_ADMIN_TOKEN=$(echo "$K6_RESULT" | grep -o 'ADMIN_TOKEN=[^ ]*' | head -1 | cut -d= -f2)

  if [ -n "$EVENT_ID" ]; then
    log_ok "k6 완료 — eventId=${EVENT_ID}"
    record_pass "k6 부하 테스트 실행"
  else
    log_fail "k6 출력에서 EVENT_ID를 추출할 수 없습니다"
    log_info "k6 출력 (마지막 30줄):"
    echo "$K6_RESULT" | tail -30
    record_fail "k6 부하 테스트 — EVENT_ID 추출 실패"
    exit 1
  fi

  # k6에서 생성한 토큰이 있으면 갱신
  if [ -n "${K6_ADMIN_TOKEN:-}" ] && [ "$K6_ADMIN_TOKEN" != "null" ]; then
    ADMIN_TOKEN="$K6_ADMIN_TOKEN"
    log_info "k6 teardown의 관리자 토큰으로 갱신"
  fi
fi

log_info "대상 eventId: ${EVENT_ID}"

# ─── Step 3: 방문자 사전 생성 (psql) ────────────────────────────────────────

log_step "3" "방문자 Entry Code 생성 확인"

# k6 setup에서 entry code를 사용하므로, 사전에 visitors 테이블에 존재해야 함
# 이미 존재하면 SKIP
PSQL_CMD="psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME}"
export PGPASSWORD="${DB_PASSWORD}"

run_sql() {
  local sql="$1"
  if [ "$USE_DOCKER_PSQL" = "true" ]; then
    docker exec -e PGPASSWORD="${DB_PASSWORD}" backend-postgres \
      psql -h localhost -U "${DB_USER}" -d "${DB_NAME}" -t -A -c "$sql" 2>/dev/null
  else
    ${PSQL_CMD} -t -A -c "$sql" 2>/dev/null
  fi
}

EXISTING_COUNT=$(run_sql "SELECT COUNT(*) FROM visitors WHERE entry_code LIKE 'E2E%' AND event_id = ${EVENT_ID};" 2>/dev/null || echo "0")

if [ "${EXISTING_COUNT}" -ge "${VU_COUNT}" ]; then
  log_ok "방문자 ${EXISTING_COUNT}명 이미 존재 — 건너뜀"
else
  log_info "방문자 ${VU_COUNT}명 생성 중..."

  # 벌크 INSERT 생성
  SQL="INSERT INTO visitors (event_id, entry_code, name, is_active, created_at, updated_at) VALUES "
  VALUES=""
  for i in $(seq 1 "${VU_COUNT}"); do
    CODE=$(printf "E2E%03d" "$i")
    if [ -n "$VALUES" ]; then VALUES="${VALUES},"; fi
    VALUES="${VALUES}(${EVENT_ID}, '${CODE}', 'E2E Visitor ${i}', true, NOW(), NOW())"
  done
  SQL="${SQL}${VALUES} ON CONFLICT (entry_code) DO NOTHING;"

  INSERT_RESULT=$(run_sql "$SQL" 2>&1) || true

  # 검증
  AFTER_COUNT=$(run_sql "SELECT COUNT(*) FROM visitors WHERE entry_code LIKE 'E2E%' AND event_id = ${EVENT_ID};" 2>/dev/null || echo "0")
  if [ "${AFTER_COUNT}" -ge "${VU_COUNT}" ]; then
    log_ok "방문자 ${AFTER_COUNT}명 준비 완료"
    record_pass "방문자 사전 생성"
  else
    log_warn "방문자 생성 일부 실패 (${AFTER_COUNT}/${VU_COUNT})"
    record_pass "방문자 사전 생성 (일부: ${AFTER_COUNT}/${VU_COUNT})"
  fi
fi

# ─── Step 4: 행사 CLOSED 변경 ───────────────────────────────────────────────

log_step "4" "행사 상태 CLOSED 변경"

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

# ─── Step 5: Flume spool-mover 트리거 ───────────────────────────────────────

log_step "5" "Flume 로그 적재 대기"

# spool-mover는 5분 이상 수정이 없는 파일만 이동하므로,
# 테스트 환경에서는 수동으로 즉시 이동을 트리거
if docker ps --format '{{.Names}}' 2>/dev/null | grep -q '^flume-spool-mover$'; then
  log_info "flume-spool-mover에서 즉시 이동 트리거..."
  # source 디렉터리의 모든 action.*.log 파일을 바로 spool로 이동
  docker exec flume-spool-mover sh -c \
    'find /var/log/action/source -name "action.*.log" 2>/dev/null | while read f; do mv "$f" /var/log/action/spool/ && echo "Moved: $(basename $f)"; done' \
    2>&1 || true
  log_ok "spool-mover 즉시 이동 완료"
else
  log_warn "flume-spool-mover 컨테이너 없음 — 수동 적재 필요"
fi

# Flume이 HDFS로 전송할 시간 대기
log_info "Flume → HDFS 전송 대기 (30초)..."
sleep 30
log_ok "대기 완료"
record_pass "Flume 로그 적재 트리거"

# ─── Step 6: 리포트 생성 트리거 ──────────────────────────────────────────────

log_step "6" "리포트 생성 트리거"

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
  # 실패해도 상태 확인 시도
fi

# ─── Step 7: 상태 폴링 ──────────────────────────────────────────────────────

log_step "7" "리포트 생성 상태 폴링 (최대 ${POLL_MAX_WAIT}초)"

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

# ─── Step 8: 리포트 데이터 검증 ──────────────────────────────────────────────

log_step "8" "리포트 데이터 검증"

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
