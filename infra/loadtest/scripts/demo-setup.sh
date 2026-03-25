#!/usr/bin/env bash
# ============================================================================
# 시연용 데이터 셋업 스크립트
#
# 목적:
#   5~10분 시연에서 "행사 종료 → 분석 리포트 생성" 을 라이브로 보여주기 위한
#   사전 데이터 준비. 이 스크립트 실행 후 시연자는:
#     1. 관리자 대시보드에서 행사를 확인
#     2. 행사 상태를 CLOSED로 변경 (또는 --auto-close 옵션 사용)
#     3. "분석 리포트 생성" 버튼 클릭
#     4. 리포트 결과 확인
#
# 사용법:
#   # 기본: 행사 OPEN 상태로 준비 (시연자가 직접 CLOSED + 리포트 생성)
#   ./demo-setup.sh
#
#   # 행사까지 CLOSED 상태로 준비 (시연자가 리포트 생성만 클릭)
#   ./demo-setup.sh --auto-close
#
#   # 소규모 테스트 (VU 5명)
#   VU_COUNT=5 ITERATIONS=2 ./demo-setup.sh
#
# 환경 변수:
#   TARGET_URL    — API 서버 (기본: https://j14a207.p.ssafy.io)
#   ADMIN_ID      — 관리자 ID
#   ADMIN_PW      — 관리자 비밀번호
#   VU_COUNT      — 시뮬레이션 방문자 수 (기본: 30)
#   ITERATIONS    — VU당 반복 횟수 (기본: 5)
#   EVENT_NAME    — 행사 이름 (기본: 자동 생성)
#   HDFS_SERVER   — Hadoop 서버 (기본: 172.26.15.39)
# ============================================================================

set -euo pipefail

# ─── Configuration ───────────────────────────────────────────────────────────

TARGET_URL="${TARGET_URL:-https://j14a207.p.ssafy.io}"
ADMIN_ID="${ADMIN_ID:?환경변수 ADMIN_ID를 설정하세요}"
ADMIN_PW="${ADMIN_PW:?환경변수 ADMIN_PW를 설정하세요}"
VU_COUNT="${VU_COUNT:-30}"
ITERATIONS="${ITERATIONS:-5}"
EVENT_NAME="${EVENT_NAME:-2026 IT 채용 박람회}"
HDFS_SERVER="${HDFS_SERVER:-172.26.15.39}"

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-freeline}"
DB_USER="${DB_USERNAME:-${DB_USER:?환경변수 DB_USERNAME을 설정하세요}}"
DB_PASSWORD="${DB_PASSWORD:?환경변수 DB_PASSWORD를 설정하세요}"

AUTO_CLOSE=false
for arg in "$@"; do
  case "$arg" in
    --auto-close) AUTO_CLOSE=true ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'

log_step()  { echo -e "\n${BLUE}━━━ [$1] $2${NC}"; }
log_ok()    { echo -e "${GREEN}  ✓ $1${NC}"; }
log_warn()  { echo -e "${YELLOW}  ⚠ $1${NC}"; }
log_fail()  { echo -e "${RED}  ✗ $1${NC}"; }
log_info()  { echo -e "  ℹ $1"; }

api_post() {
  local path="$1" body="$2" token="${3:-}"
  local h_auth=""
  [ -n "$token" ] && h_auth="-H \"Authorization: Bearer ${token}\""
  eval curl -s -w '\\n%{http_code}' \
    -X POST "\"${TARGET_URL}${path}\"" \
    -H '"Content-Type: application/json"' \
    ${h_auth} \
    -d "'${body}'"
}

api_patch() {
  local path="$1" body="$2" token="${3:-}"
  local h_auth=""
  [ -n "$token" ] && h_auth="-H \"Authorization: Bearer ${token}\""
  eval curl -s -w '\\n%{http_code}' \
    -X PATCH "\"${TARGET_URL}${path}\"" \
    -H '"Content-Type: application/json"' \
    ${h_auth} \
    -d "'${body}'"
}

parse_response() {
  local response="$1"
  RESP_BODY=$(echo "$response" | head -n -1)
  RESP_CODE=$(echo "$response" | tail -n 1)
}

extract_json_field() {
  local json="$1" field="$2"
  echo "$json" | grep -o "\"${field}\"[[:space:]]*:[[:space:]]*[^,}]*" | head -1 | sed 's/.*:[[:space:]]*//' | tr -d '"' | tr -d ' '
}

run_sql() {
  local sql="$1"
  if command -v psql &>/dev/null; then
    PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -A -c "$sql" 2>/dev/null
  else
    docker exec -e PGPASSWORD="${DB_PASSWORD}" freeline-db \
      psql -h localhost -U "${DB_USER}" -d "${DB_NAME}" -t -A -c "$sql" 2>/dev/null
  fi
}

# ─── Banner ──────────────────────────────────────────────────────────────────

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║           Freeline 시연용 데이터 셋업 스크립트          ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  행사명:   ${EVENT_NAME}"
echo "║  방문자:   ${VU_COUNT}명 × ${ITERATIONS}회 시뮬레이션"
echo "║  자동종료: ${AUTO_CLOSE}"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ═══════════════════════════════════════════════════════════════════════════════
# Step 1: 관리자 로그인
# ═══════════════════════════════════════════════════════════════════════════════

log_step "1" "관리자 로그인"

LOGIN_RESP=$(api_post "/api/v1/auth/login" "{\"id\":\"${ADMIN_ID}\",\"password\":\"${ADMIN_PW}\"}")
parse_response "$LOGIN_RESP"

if [ "$RESP_CODE" != "200" ]; then
  log_fail "로그인 실패 (HTTP ${RESP_CODE})"
  exit 1
fi

ADMIN_TOKEN=$(extract_json_field "$RESP_BODY" "accessToken")
log_ok "로그인 성공"

# ═══════════════════════════════════════════════════════════════════════════════
# Step 2: 행사 생성
# ═══════════════════════════════════════════════════════════════════════════════

log_step "2" "행사 생성: ${EVENT_NAME}"

TODAY=$(date +%Y-%m-%d)
END_DATE=$(date -d "+7 days" +%Y-%m-%d 2>/dev/null || date -v+7d +%Y-%m-%d)

EVENT_RESP=$(api_post "/api/v1/events" \
  "{\"name\":\"${EVENT_NAME}\",\"description\":\"대한민국 대표 IT기업들이 한자리에 모이는 채용 박람회입니다. 다양한 부스에서 채용 상담과 기업 소개를 받아보세요.\",\"startDate\":\"${TODAY}\",\"endDate\":\"${END_DATE}\",\"openTime\":\"09:00:00\",\"closeTime\":\"18:00:00\",\"locationAddress\":\"서울특별시 강남구 테헤란로 212 멀티캠퍼스\"}" \
  "$ADMIN_TOKEN")
parse_response "$EVENT_RESP"

if [ "$RESP_CODE" != "200" ] && [ "$RESP_CODE" != "201" ]; then
  log_fail "행사 생성 실패 (HTTP ${RESP_CODE}): ${RESP_BODY}"
  exit 1
fi

EVENT_ID=$(extract_json_field "$RESP_BODY" "eventId")
[ -z "$EVENT_ID" ] || [ "$EVENT_ID" = "null" ] && EVENT_ID=$(extract_json_field "$RESP_BODY" "id")
log_ok "행사 생성 완료: eventId=${EVENT_ID}"

# ═══════════════════════════════════════════════════════════════════════════════
# Step 3: 부스 생성 (실감나는 기업 부스)
# ═══════════════════════════════════════════════════════════════════════════════

log_step "3" "부스 생성"

BOOTH_NAMES=("삼성전자" "LG전자" "현대자동차" "SK하이닉스" "네이버" "카카오" "쿠팡" "배달의민족" "토스" "당근마켓")
LOCATION_CODES=("A-01" "A-02" "B-01" "B-02" "C-01" "C-02" "D-01" "D-02" "E-01" "E-02")
BOOTH_IDS=()

for i in $(seq 0 9); do
  BOOTH_RESP=$(api_post "/api/v1/booths/events/${EVENT_ID}" \
    "{\"name\":\"${BOOTH_NAMES[$i]}\",\"locationCode\":\"${LOCATION_CODES[$i]}\",\"openTime\":\"09:00:00\",\"closeTime\":\"18:00:00\"}" \
    "$ADMIN_TOKEN")
  parse_response "$BOOTH_RESP"

  if [ "$RESP_CODE" = "200" ] || [ "$RESP_CODE" = "201" ]; then
    BID=$(extract_json_field "$RESP_BODY" "boothId")
    [ -z "$BID" ] || [ "$BID" = "null" ] && BID=$(extract_json_field "$RESP_BODY" "id")
    BOOTH_IDS+=("$BID")
  else
    log_warn "부스 '${BOOTH_NAMES[$i]}' 생성 실패"
  fi
done

BOOTH_IDS_CSV=$(IFS=,; echo "${BOOTH_IDS[*]}")
log_ok "부스 ${#BOOTH_IDS[@]}개 생성: ${BOOTH_IDS_CSV}"

# ═══════════════════════════════════════════════════════════════════════════════
# Step 4: 방문자 DB 생성
# ═══════════════════════════════════════════════════════════════════════════════

log_step "4" "방문자 ${VU_COUNT}명 DB 생성"

SQL="INSERT INTO visitors (event_id, entry_code, name, is_active, created_at, updated_at) VALUES "
VALUES=""
KOREAN_NAMES=("김민수" "이서연" "박지호" "최유진" "정도현" "강수빈" "조현우" "윤서영" "임재현" "한예린"
              "송민지" "오태양" "배은서" "홍준혁" "류하은" "문성민" "신유나" "권도윤" "황지우" "전소율"
              "장민재" "안서현" "서준호" "남지안" "유하윤" "구민서" "노태현" "양수아" "하지훈" "손예나"
              "김태윤" "이하린" "박준서" "최서아" "정민호" "강은우" "조하영" "윤재민" "임소희" "한도영"
              "송유진" "오서윤" "배준혁" "홍지아" "류민재" "문수현" "신태양" "권서영" "황도현" "전유나")

for i in $(seq 1 "${VU_COUNT}"); do
  CODE=$(printf "E2E%03d" "$i")
  NAME_IDX=$(( (i - 1) % ${#KOREAN_NAMES[@]} ))
  VISITOR_NAME="${KOREAN_NAMES[$NAME_IDX]}"
  if [ -n "$VALUES" ]; then VALUES="${VALUES},"; fi
  VALUES="${VALUES}(${EVENT_ID}, '${CODE}', '${VISITOR_NAME}', true, NOW(), NOW())"
done
SQL="${SQL}${VALUES} ON CONFLICT (entry_code) DO NOTHING;"

run_sql "$SQL" 2>&1 || true

AFTER_COUNT=$(run_sql "SELECT COUNT(*) FROM visitors WHERE event_id = ${EVENT_ID};" 2>/dev/null || echo "0")
log_ok "방문자 ${AFTER_COUNT}명 생성 완료"

# ═══════════════════════════════════════════════════════════════════════════════
# Step 5: 지도 이미지 업로드 + 행사 OPEN
# ═══════════════════════════════════════════════════════════════════════════════

log_step "5" "지도 이미지 업로드 + 행사 OPEN"

DUMMY_PNG="/tmp/demo_map_${EVENT_ID}.png"
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

curl -s -X POST "${TARGET_URL}/api/v1/boothmaps/events/${EVENT_ID}/image" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -F "file=@${DUMMY_PNG};type=image/png" > /dev/null 2>&1 || true
rm -f "$DUMMY_PNG"

OPEN_RESP=$(api_patch "/api/v1/events/${EVENT_ID}" '{"status":"OPEN"}' "$ADMIN_TOKEN")
parse_response "$OPEN_RESP"

if [ "$RESP_CODE" = "200" ]; then
  log_ok "행사 OPEN 완료"
else
  log_fail "행사 OPEN 실패 (HTTP ${RESP_CODE}): ${RESP_BODY}"
  exit 1
fi

# ═══════════════════════════════════════════════════════════════════════════════
# Step 6: k6 방문자 시뮬레이션
# ═══════════════════════════════════════════════════════════════════════════════

log_step "6" "방문자 시뮬레이션 (k6: ${VU_COUNT} VU × ${ITERATIONS} iterations)"

K6_ENV="-e TARGET_URL=${TARGET_URL} -e ADMIN_ID=${ADMIN_ID} -e ADMIN_PW=${ADMIN_PW} -e VU_COUNT=${VU_COUNT} -e ITERATIONS=${ITERATIONS} -e PRESET_EVENT_ID=${EVENT_ID} -e PRESET_BOOTH_IDS=${BOOTH_IDS_CSV}"

K6_OK=false
if ssh -o ConnectTimeout=5 "${HDFS_SERVER}" "docker ps --format '{{.Names}}' | grep -q k6-manager" 2>/dev/null; then
  log_info "Server B k6-manager에서 실행..."
  K6_RESULT=$(ssh "${HDFS_SERVER}" "docker exec k6-manager k6 run ${K6_ENV} /scripts/e2e-report-test.js" 2>&1) || true
  K6_OK=true
elif command -v k6 &>/dev/null; then
  log_info "로컬 k6로 실행..."
  K6_RESULT=$(k6 run ${K6_ENV} "${SCRIPT_DIR}/e2e-report-test.js" 2>&1) || true
  K6_OK=true
elif docker ps --format '{{.Names}}' 2>/dev/null | grep -q '^k6-manager$'; then
  log_info "로컬 k6-manager 컨테이너에서 실행..."
  K6_RESULT=$(docker exec k6-manager k6 run ${K6_ENV} /scripts/e2e-report-test.js 2>&1) || true
  K6_OK=true
else
  log_fail "k6를 찾을 수 없습니다"
  exit 1
fi

if [ "$K6_OK" = "true" ]; then
  # 주요 메트릭만 출력
  echo "$K6_RESULT" | grep -E "✓|✗|http_req_duration|http_req_failed|action_logs_sent|waitings_created" | head -15
  log_ok "k6 시뮬레이션 완료"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# Step 7: 액션 로그 → HDFS 적재
# ═══════════════════════════════════════════════════════════════════════════════

log_step "7" "액션 로그 → HDFS 적재"

HDFS_OK=false

# 직접 HDFS 업로드 (E2E에서는 active action.log가 아직 롤링 전이므로 직접 업로드가 필수)
TMP_LOG="/tmp/demo_action_${EVENT_ID}.log"

log_info "백엔드에서 액션 로그 추출..."
docker cp freeline-backend:/app/logs/action/action.log "$TMP_LOG" 2>/dev/null || true

if [ -s "$TMP_LOG" ]; then
  LOG_LINES=$(wc -l < "$TMP_LOG")
  log_ok "로그 파일 추출: ${LOG_LINES}줄"

  HDFS_DATE=$(date +%Y-%m-%d)
  HDFS_HOUR=$(date +%H)
  HDFS_TARGET_PATH="/data/logs/action/${HDFS_DATE}/${HDFS_HOUR}"
  HDFS_TARGET_FILE="action-demo-${EVENT_ID}.log"

  log_info "HDFS 업로드: ${HDFS_TARGET_PATH}/${HDFS_TARGET_FILE}"
  scp -o ConnectTimeout=5 "$TMP_LOG" "${HDFS_SERVER}:/tmp/demo_action.log" && \
  ssh -o ConnectTimeout=5 "${HDFS_SERVER}" "
    docker cp /tmp/demo_action.log hadoop-namenode:/tmp/demo_action.log && \
    docker exec hadoop-namenode hdfs dfs -mkdir -p ${HDFS_TARGET_PATH} && \
    docker exec hadoop-namenode hdfs dfs -put -f /tmp/demo_action.log ${HDFS_TARGET_PATH}/${HDFS_TARGET_FILE}
  " && HDFS_OK=true
  rm -f "$TMP_LOG"
else
  log_warn "백엔드 로그 파일이 비어있거나 없음"
  rm -f "$TMP_LOG"
fi

# 롤링된 파일이 있으면 spool-mover도 트리거 (보조)
if docker ps --format '{{.Names}}' 2>/dev/null | grep -q '^flume-spool-mover$'; then
  docker exec flume-spool-mover sh -c \
    'find /var/log/action/source -name "action.*.log" -mmin +1 2>/dev/null | while read f; do mv "$f" /var/log/action/spool/ 2>/dev/null && echo "Moved: $(basename $f)"; done' \
    2>&1 || true
fi

if [ "$HDFS_OK" = "true" ]; then
  log_ok "HDFS 적재 완료"
else
  log_warn "HDFS 적재 확인 불가 — Flume 자동 적재에 의존"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# Step 8: 행사 CLOSED (옵션)
# ═══════════════════════════════════════════════════════════════════════════════

if [ "$AUTO_CLOSE" = "true" ]; then
  log_step "8" "행사 CLOSED 변경"
  CLOSE_RESP=$(api_patch "/api/v1/events/${EVENT_ID}" '{"status":"CLOSED"}' "$ADMIN_TOKEN")
  parse_response "$CLOSE_RESP"
  if [ "$RESP_CODE" = "200" ]; then
    log_ok "행사 CLOSED 완료"
  else
    log_warn "행사 CLOSED 실패 — 시연 시 수동으로 변경하세요"
  fi
else
  log_step "8" "행사 상태 유지 (OPEN)"
  log_info "시연 시 직접 행사를 종료하고 리포트를 생성하세요"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# 완료 안내
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║              시연 데이터 준비 완료!                     ║${NC}"
echo -e "${CYAN}╠══════════════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║${NC}"
echo -e "${CYAN}║${NC}  행사 ID:     ${GREEN}${EVENT_ID}${NC}"
echo -e "${CYAN}║${NC}  행사명:      ${EVENT_NAME}"
echo -e "${CYAN}║${NC}  부스:        ${#BOOTH_IDS[@]}개 (${BOOTH_NAMES[*]})"
echo -e "${CYAN}║${NC}  방문자:      ${VU_COUNT}명"
echo -e "${CYAN}║${NC}  현재 상태:   $([ "$AUTO_CLOSE" = "true" ] && echo "CLOSED" || echo "OPEN")"
echo -e "${CYAN}║${NC}"
echo -e "${CYAN}╠══════════════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║${NC}  ${YELLOW}시연 순서:${NC}"

if [ "$AUTO_CLOSE" = "true" ]; then
  echo -e "${CYAN}║${NC}    1. 관리자 대시보드에서 행사 '${EVENT_NAME}' 선택"
  echo -e "${CYAN}║${NC}    2. '분석 리포트 생성' 버튼 클릭"
  echo -e "${CYAN}║${NC}    3. 약 15~30초 대기 후 리포트 결과 확인"
else
  echo -e "${CYAN}║${NC}    1. 관리자 대시보드에서 행사 '${EVENT_NAME}' 선택"
  echo -e "${CYAN}║${NC}    2. 행사 상태를 'CLOSED'로 변경"
  echo -e "${CYAN}║${NC}    3. '분석 리포트 생성' 버튼 클릭"
  echo -e "${CYAN}║${NC}    4. 약 15~30초 대기 후 리포트 결과 확인"
fi

echo -e "${CYAN}║${NC}"
echo -e "${CYAN}║${NC}  ${YELLOW}기대 결과:${NC}"
echo -e "${CYAN}║${NC}    - 이벤트 요약 (총 방문자/등록/이탈률/피크시간)"
echo -e "${CYAN}║${NC}    - 부스별 성과 (조회수/등록수/전환율/이탈율)"
echo -e "${CYAN}║${NC}    - 시간대별 유입량"
echo -e "${CYAN}║${NC}    - 방문자 동선 패턴 (Top 50)"
echo -e "${CYAN}║${NC}    - 문제 지점 (높은 이탈률 부스)"
echo -e "${CYAN}║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"

# API로 직접 리포트 생성하려면:
echo ""
echo -e "  ${BLUE}[참고] CLI로 리포트 생성:${NC}"
echo "  TOKEN=\$(curl -s -X POST ${TARGET_URL}/api/v1/auth/login \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"id\":\"${ADMIN_ID}\",\"password\":\"${ADMIN_PW}\"}' | python3 -c \"import sys,json; print(json.load(sys.stdin)['data']['accessToken'])\")"
echo ""
echo "  # 행사 CLOSED (필요 시)"
echo "  curl -X PATCH ${TARGET_URL}/api/v1/events/${EVENT_ID} -H 'Content-Type: application/json' -H \"Authorization: Bearer \$TOKEN\" -d '{\"status\":\"CLOSED\"}'"
echo ""
echo "  # 리포트 생성"
echo "  curl -X POST ${TARGET_URL}/api/v1/reports/events/${EVENT_ID}/generate -H \"Authorization: Bearer \$TOKEN\""
echo ""
echo "  # 상태 확인"
echo "  curl -s ${TARGET_URL}/api/v1/reports/events/${EVENT_ID}/status -H \"Authorization: Bearer \$TOKEN\" | python3 -m json.tool"
echo ""
echo "  # 리포트 조회"
echo "  curl -s ${TARGET_URL}/api/v1/reports/events/${EVENT_ID} -H \"Authorization: Bearer \$TOKEN\" | python3 -m json.tool"
