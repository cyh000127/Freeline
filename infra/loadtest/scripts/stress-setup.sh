#!/usr/bin/env bash
# ============================================================================
# 고도화 부하 테스트 실행 스크립트
#
# 실제 방문자 행동을 시뮬레이션하는 stress-test.js를 실행합니다.
# ramping-vus 방식으로 점진적 증가 → 피크 유지 → 스파이크 → 안정화 프로파일.
#
# 사용법:
#   ./run.sh stress                                    # 기본 (100 peak, 200 spike)
#   PEAK_VUS=200 SPIKE_VUS=500 ./run.sh stress         # 대규모
#   PEAK_VUS=20 ./run.sh stress                        # 소규모 검증
#
# 환경 변수:
#   TARGET_URL     — API 서버 (기본: https://j14a207.p.ssafy.io)
#   ADMIN_ID       — 관리자 ID
#   ADMIN_PW       — 관리자 비밀번호
#   PEAK_VUS       — 피크 동시 사용자 수 (기본: 100)
#   SPIKE_VUS      — 스파이크 동시 사용자 수 (기본: PEAK_VUS × 2)
#   TEST_DURATION  — 피크 지속 시간 (기본: "3m")
#   ENTRY_CODE_POOL — entry code 생성 수 (기본: SPIKE_VUS, VU당 1개)
# ============================================================================

set -euo pipefail

# ─── Configuration ───────────────────────────────────────────────────────────

TARGET_URL="${TARGET_URL:-https://j14a207.p.ssafy.io}"
ADMIN_ID="${ADMIN_ID:?환경변수 ADMIN_ID를 설정하세요}"
ADMIN_PW="${ADMIN_PW:?환경변수 ADMIN_PW를 설정하세요}"
PEAK_VUS="${PEAK_VUS:-100}"
SPIKE_VUS="${SPIKE_VUS:-$((PEAK_VUS * 2))}"
TEST_DURATION="${TEST_DURATION:-3m}"

ENTRY_CODE_POOL="${ENTRY_CODE_POOL:-${SPIKE_VUS}}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
K6_SERVER="${K6_SERVER:-172.26.15.39}"

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

parse_response() {
  local response="$1"
  RESP_BODY=$(echo "$response" | head -n -1)
  RESP_CODE=$(echo "$response" | tail -n 1)
}

extract_json_field() {
  local json="$1" field="$2"
  echo "$json" | grep -o "\"${field}\"[[:space:]]*:[[:space:]]*[^,}]*" | head -1 | sed 's/.*:[[:space:]]*//' | tr -d '"' | tr -d ' '
}

# ─── Banner ──────────────────────────────────────────────────────────────────

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║          Freeline 고도화 부하 테스트 (Stress)           ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  Peak VUs:    ${PEAK_VUS}"
echo "║  Spike VUs:   ${SPIKE_VUS}"
echo "║  Duration:    ${TEST_DURATION}"
echo "║  프로파일:    ramp-up → peak → spike → recovery → down"
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
# Step 2: 행사 + 부스 생성
# ═══════════════════════════════════════════════════════════════════════════════

log_step "2" "행사 + 부스 생성"

TODAY=$(date +%Y-%m-%d)
END_DATE=$(date -d "+3 days" +%Y-%m-%d 2>/dev/null || date -v+3d +%Y-%m-%d)

EVENT_RESP=$(api_post "/api/v1/events" \
  "{\"name\":\"[Stress Test] 부하 테스트 $(date +%H:%M:%S)\",\"description\":\"고도화 부하 테스트 자동 생성\",\"startDate\":\"${TODAY}\",\"endDate\":\"${END_DATE}\",\"openTime\":\"09:00:00\",\"closeTime\":\"23:59:00\",\"locationAddress\":\"서울특별시 강남구 테헤란로 212\"}" \
  "$ADMIN_TOKEN")
parse_response "$EVENT_RESP"

if [ "$RESP_CODE" != "200" ] && [ "$RESP_CODE" != "201" ]; then
  log_fail "행사 생성 실패 (HTTP ${RESP_CODE}): ${RESP_BODY}"
  exit 1
fi

EVENT_ID=$(extract_json_field "$RESP_BODY" "eventId")
[ -z "$EVENT_ID" ] || [ "$EVENT_ID" = "null" ] && EVENT_ID=$(extract_json_field "$RESP_BODY" "id")
log_ok "행사 생성: eventId=${EVENT_ID}"

BOOTH_NAMES=("삼성전자" "LG전자" "현대자동차" "SK하이닉스" "네이버" "카카오" "쿠팡" "배달의민족" "토스" "당근마켓")
LOCATION_CODES=("A-01" "A-02" "B-01" "B-02" "C-01" "C-02" "D-01" "D-02" "E-01" "E-02")
BOOTH_IDS=()

for i in $(seq 0 9); do
  BOOTH_RESP=$(api_post "/api/v1/booths/events/${EVENT_ID}" \
    "{\"name\":\"${BOOTH_NAMES[$i]}\",\"locationCode\":\"${LOCATION_CODES[$i]}\",\"openTime\":\"09:00:00\",\"closeTime\":\"23:59:00\"}" \
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
# Step 3: Entry Code 생성 (API: VU당 1개)
# ═══════════════════════════════════════════════════════════════════════════════

# VU 1개 = 방문자 1명 — 첫 iteration에서 인증, 이후 토큰 재사용
# SPIKE_VUS 수만큼 entry code를 생성하면 충분
log_step "3" "Entry Code ${ENTRY_CODE_POOL}개 생성 (API bulk, VU당 1개)"

ENTRY_CODES_FILE="/tmp/stress_entry_codes_${EVENT_ID}.json"

BULK_RESP=$(api_post "/api/v1/auth/entry-codes/bulk" \
  "{\"eventId\":${EVENT_ID},\"quantity\":${ENTRY_CODE_POOL}}" \
  "$ADMIN_TOKEN")
parse_response "$BULK_RESP"

if [ "$RESP_CODE" != "200" ] && [ "$RESP_CODE" != "201" ]; then
  log_fail "Entry Code 생성 실패 (HTTP ${RESP_CODE}): ${RESP_BODY}"
  exit 1
fi

CREATED_COUNT=$(extract_json_field "$RESP_BODY" "createdCount")
[ -z "$CREATED_COUNT" ] || [ "$CREATED_COUNT" = "null" ] && CREATED_COUNT=$ENTRY_CODE_POOL

# bulk API 응답에서 실제 entry code 목록을 JSON 배열로 저장
# k6 SharedArray에서 읽기 위함
echo "$RESP_BODY" | python3 -c "
import sys, json
data = json.load(sys.stdin)
codes = [item['entryCode'] for item in data.get('data', data).get('entryCodes', [])]
json.dump(codes, sys.stdout)
" > "$ENTRY_CODES_FILE" 2>/dev/null

CODE_COUNT=$(python3 -c "import json; print(len(json.load(open('${ENTRY_CODES_FILE}'))))" 2>/dev/null || echo "0")
log_ok "Entry Code ${CREATED_COUNT}개 생성, ${CODE_COUNT}개 파일 저장 (${ENTRY_CODES_FILE})"

# ═══════════════════════════════════════════════════════════════════════════════
# Step 4: 지도 이미지 업로드 + 행사 OPEN
# ═══════════════════════════════════════════════════════════════════════════════

log_step "4" "지도 이미지 업로드 + 행사 OPEN"

DUMMY_PNG="/tmp/stress_map_${EVENT_ID}.png"
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
# Step 5: k6 Stress Test 실행
# ═══════════════════════════════════════════════════════════════════════════════

log_step "5" "k6 Stress Test 실행 (peak=${PEAK_VUS}, spike=${SPIKE_VUS}, duration=${TEST_DURATION})"

K6_ENV="-e TARGET_URL=${TARGET_URL} -e ADMIN_ID=${ADMIN_ID} -e ADMIN_PW=${ADMIN_PW} -e PRESET_EVENT_ID=${EVENT_ID} -e PRESET_BOOTH_IDS=${BOOTH_IDS_CSV} -e PEAK_VUS=${PEAK_VUS} -e SPIKE_VUS=${SPIKE_VUS} -e TEST_DURATION=${TEST_DURATION} -e ENTRY_CODES_FILE=/scripts/entry_codes.json"
K6_OUT="--out experimental-prometheus-rw"

K6_OK=false
if ssh -o ConnectTimeout=5 "${K6_SERVER}" "docker ps --format '{{.Names}}' | grep -q k6-manager" 2>/dev/null; then
  log_info "Server B k6-manager에서 실행..."
  # /scripts는 호스트 바인드 마운트 — 호스트 경로에 직접 복사
  K6_SCRIPTS_HOST=$(ssh "${K6_SERVER}" "docker inspect k6-manager --format '{{range .Mounts}}{{if eq .Destination \"/scripts\"}}{{.Source}}{{end}}{{end}}'" 2>/dev/null)
  scp -q "$ENTRY_CODES_FILE" "${K6_SERVER}:${K6_SCRIPTS_HOST}/entry_codes.json" 2>/dev/null
  K6_RESULT=$(ssh "${K6_SERVER}" "docker exec k6-manager k6 run ${K6_OUT} ${K6_ENV} /scripts/stress-test.js" 2>&1) || true
  K6_OK=true
elif command -v k6 &>/dev/null; then
  log_info "로컬 k6로 실행..."
  K6_ENV="-e TARGET_URL=${TARGET_URL} -e ADMIN_ID=${ADMIN_ID} -e ADMIN_PW=${ADMIN_PW} -e PRESET_EVENT_ID=${EVENT_ID} -e PRESET_BOOTH_IDS=${BOOTH_IDS_CSV} -e PEAK_VUS=${PEAK_VUS} -e SPIKE_VUS=${SPIKE_VUS} -e TEST_DURATION=${TEST_DURATION} -e ENTRY_CODES_FILE=${ENTRY_CODES_FILE}"
  K6_RESULT=$(k6 run ${K6_ENV} "${SCRIPT_DIR}/stress-test.js" 2>&1) || true
  K6_OK=true
elif docker ps --format '{{.Names}}' 2>/dev/null | grep -q '^k6-manager$'; then
  log_info "로컬 k6-manager 컨테이너에서 실행..."
  docker cp "$ENTRY_CODES_FILE" k6-manager:/scripts/entry_codes.json 2>/dev/null
  K6_RESULT=$(docker exec k6-manager k6 run ${K6_OUT} ${K6_ENV} /scripts/stress-test.js 2>&1) || true
  K6_OK=true
else
  log_fail "k6를 찾을 수 없습니다"
  exit 1
fi

if [ "$K6_OK" = "true" ]; then
  echo ""
  echo "$K6_RESULT" | tail -50
  log_ok "k6 Stress Test 완료"
fi

rm -f "$ENTRY_CODES_FILE"

# ═══════════════════════════════════════════════════════════════════════════════
# Step 6: 행사 CLOSED
# ═══════════════════════════════════════════════════════════════════════════════

log_step "6" "행사 CLOSED"

CLOSE_RESP=$(api_patch "/api/v1/events/${EVENT_ID}" '{"status":"CLOSED"}' "$ADMIN_TOKEN")
parse_response "$CLOSE_RESP"
if [ "$RESP_CODE" = "200" ]; then
  log_ok "행사 CLOSED 완료"
else
  log_warn "행사 CLOSED 실패 (HTTP ${RESP_CODE})"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# 완료 안내
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║              Stress Test 완료                           ║${NC}"
echo -e "${CYAN}╠══════════════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║${NC}  행사 ID:     ${GREEN}${EVENT_ID}${NC}"
echo -e "${CYAN}║${NC}  Peak VUs:    ${PEAK_VUS}"
echo -e "${CYAN}║${NC}  Spike VUs:   ${SPIKE_VUS}"
echo -e "${CYAN}║${NC}  Duration:    ${TEST_DURATION}"
echo -e "${CYAN}║${NC}"
echo -e "${CYAN}║${NC}  ${YELLOW}Grafana 대시보드에서 결과를 확인하세요:${NC}"
echo -e "${CYAN}║${NC}    https://j14a207.p.ssafy.io/grafana/ → Load Testing"
echo -e "${CYAN}║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
