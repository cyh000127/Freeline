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
#   # 행사 CLOSED + 리포트 자동 생성
#   ./demo-setup.sh --auto-close --auto-report
#
#   # 완성형 데모 팩: 부스 관리자 계정 + CLOSED + 리포트 생성까지 자동
#   ./demo-setup.sh --ready-pack
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
#   MAP_IMAGE_FILE — 행사 지도 업로드용 이미지 경로 (기본: 모바일 배너 이미지)
#   BOOTH_ADMIN_PASSWORD_PREFIX — 부스 관리자 고정 비밀번호 prefix (기본: DemoBooth!)
#   REPORT_POLL_MAX_WAIT — 리포트 폴링 최대 시간(초, 기본 300)
# ============================================================================

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ─── Configuration ───────────────────────────────────────────────────────────

TARGET_URL="${TARGET_URL:-https://j14a207.p.ssafy.io}"
ADMIN_ID="${ADMIN_ID:?환경변수 ADMIN_ID를 설정하세요}"
ADMIN_PW="${ADMIN_PW:?환경변수 ADMIN_PW를 설정하세요}"
VU_COUNT="${VU_COUNT:-30}"
ITERATIONS="${ITERATIONS:-5}"
EVENT_NAME="${EVENT_NAME:-2026 IT 채용 박람회}"
HDFS_SERVER="${HDFS_SERVER:-172.26.15.39}"
MAP_IMAGE_FILE="${MAP_IMAGE_FILE:-${SCRIPT_DIR}/../../../fe/freeline-user/assets/events/event_banner.png}"
BOOTH_ADMIN_PASSWORD_PREFIX="${BOOTH_ADMIN_PASSWORD_PREFIX:-DemoBooth!}"
REPORT_POLL_INTERVAL="${REPORT_POLL_INTERVAL:-5}"
REPORT_POLL_MAX_WAIT="${REPORT_POLL_MAX_WAIT:-300}"
REPORT_FALLBACK_SEED="${REPORT_FALLBACK_SEED:-false}"
SEED_BOOTH_ADMINS="${SEED_BOOTH_ADMINS:-true}"
SET_BOOTH_ADMIN_PASSWORDS="${SET_BOOTH_ADMIN_PASSWORDS:-true}"

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-freeline}"
DB_USER="${DB_USERNAME:-${DB_USER:?환경변수 DB_USERNAME을 설정하세요}}"
DB_PASSWORD="${DB_PASSWORD:?환경변수 DB_PASSWORD를 설정하세요}"

AUTO_CLOSE=false
AUTO_REPORT=false
READY_PACK=false
for arg in "$@"; do
  case "$arg" in
    --auto-close) AUTO_CLOSE=true ;;
    --auto-report) AUTO_REPORT=true ;;
    --ready-pack) READY_PACK=true ;;
  esac
done

if [ "$READY_PACK" = "true" ]; then
  AUTO_CLOSE=true
  AUTO_REPORT=true
  SEED_BOOTH_ADMINS=true
  SET_BOOTH_ADMIN_PASSWORDS=true
  REPORT_FALLBACK_SEED=true
fi

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

run_sql() {
  local sql="$1"
  if command -v psql &>/dev/null; then
    PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -A -c "$sql" 2>/dev/null
  else
    docker exec -e PGPASSWORD="${DB_PASSWORD}" freeline-db \
      psql -h localhost -U "${DB_USER}" -d "${DB_NAME}" -t -A -c "$sql" 2>/dev/null
  fi
}

run_sql_file() {
  local file="$1"
  if command -v psql &>/dev/null; then
    PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -A -f "$file" 2>/dev/null
  else
    docker cp "$file" freeline-db:/tmp/_bulk_insert.sql && \
    docker exec -e PGPASSWORD="${DB_PASSWORD}" freeline-db \
      psql -h localhost -U "${DB_USER}" -d "${DB_NAME}" -t -A -f /tmp/_bulk_insert.sql 2>/dev/null
  fi
}

find_booth_name_by_id() {
  local target_id="$1"
  for i in "${!BOOTH_IDS[@]}"; do
    if [ "${BOOTH_IDS[$i]}" = "$target_id" ]; then
      echo "${BOOTH_NAMES[$i]}"
      return 0
    fi
  done
  echo "Unknown Booth"
}

create_booth_admin_accounts() {
  BOOTH_ADMIN_TSV_FILE="/tmp/demo_booth_admins_${EVENT_ID}.tsv"
  BOOTH_ADMIN_EXPORT_FILE="/tmp/demo_booth_admins_export_${EVENT_ID}.tsv"
  : > "$BOOTH_ADMIN_TSV_FILE"
  : > "$BOOTH_ADMIN_EXPORT_FILE"

  if [ "${#BOOTH_IDS[@]}" -eq 0 ]; then
    log_warn "부스가 없어 부스 관리자 계정 생성을 건너뜁니다"
    return
  fi

  local admin_items=""
  for i in "${!BOOTH_IDS[@]}"; do
    local booth_id="${BOOTH_IDS[$i]}"
    local email="booth$((i + 1)).event${EVENT_ID}@freeline.demo"
    if [ -n "$admin_items" ]; then
      admin_items="${admin_items},"
    fi
    admin_items="${admin_items}{\"boothId\":${booth_id},\"email\":\"${email}\"}"
  done

  local payload="{\"eventId\":${EVENT_ID},\"admins\":[${admin_items}]}"
  local admin_resp
  admin_resp=$(api_post "/api/v1/auth/booth-admins/bulk" "$payload" "$ADMIN_TOKEN")
  parse_response "$admin_resp"

  if [ "$RESP_CODE" != "200" ] && [ "$RESP_CODE" != "201" ]; then
    log_warn "부스 관리자 일괄 생성 실패 (HTTP ${RESP_CODE})"
    log_info "응답: ${RESP_BODY}"
    return
  fi

  local raw_json_file="/tmp/demo_booth_admins_raw_${EVENT_ID}.json"
  echo "$RESP_BODY" > "$raw_json_file"

  python3 - "$raw_json_file" "$BOOTH_ADMIN_TSV_FILE" <<'PY'
import json
import sys

src = sys.argv[1]
dst = sys.argv[2]

with open(src, "r", encoding="utf-8") as f:
    body = json.load(f)

data = body.get("data", body)
if not isinstance(data, list):
    data = []

with open(dst, "w", encoding="utf-8") as out:
    out.write("booth_id\tlogin_id\temail\traw_password\n")
    for item in data:
        out.write(
            f"{item.get('boothId','')}\t{item.get('loginId','')}\t{item.get('email','')}\t{item.get('rawPassword','')}\n"
        )
PY
  rm -f "$raw_json_file"

  local created_count
  created_count=$(tail -n +2 "$BOOTH_ADMIN_TSV_FILE" | wc -l | tr -d ' ')
  log_ok "부스 관리자 ${created_count}개 생성 완료"

  # 부스명 기반으로 관리자 표시명/회사 정보를 채워 UX를 개선합니다.
  for booth_id in "${BOOTH_IDS[@]}"; do
    local booth_name
    booth_name=$(find_booth_name_by_id "$booth_id")
    run_sql "UPDATE booth_admins SET admin_name='${booth_name} 담당자', company='${booth_name}' WHERE booth_id=${booth_id};" >/dev/null 2>&1 || true
  done
}

apply_standard_booth_admin_passwords() {
  if [ ! -f "${BOOTH_ADMIN_TSV_FILE:-}" ]; then
    log_warn "부스 관리자 계정 파일이 없어 고정 비밀번호 설정을 건너뜁니다"
    return
  fi

  echo -e "booth_id\tbooth_name\tlogin_id\temail\tpassword\tpassword_ready" > "$BOOTH_ADMIN_EXPORT_FILE"

  while IFS=$'\t' read -r booth_id login_id email raw_password; do
    if [ -z "$booth_id" ] || [ "$booth_id" = "booth_id" ]; then
      continue
    fi
    local booth_name
    booth_name=$(find_booth_name_by_id "$booth_id")

    local final_password="$raw_password"
    local password_ready="false"

    if [ -n "$raw_password" ]; then
      local fixed_password="${BOOTH_ADMIN_PASSWORD_PREFIX}${booth_id}"
      local pwd_resp
      pwd_resp=$(api_patch "/api/v1/auth/booth-admins/password/initial" \
        "{\"loginId\":\"${login_id}\",\"oldPassword\":\"${raw_password}\",\"newPassword\":\"${fixed_password}\"}")
      parse_response "$pwd_resp"

      if [ "$RESP_CODE" = "200" ]; then
        final_password="$fixed_password"
        password_ready="true"
      fi
    fi

    echo -e "${booth_id}\t${booth_name}\t${login_id}\t${email}\t${final_password}\t${password_ready}" >> "$BOOTH_ADMIN_EXPORT_FILE"
  done < "$BOOTH_ADMIN_TSV_FILE"

  local ready_count
  ready_count=$(awk -F'\t' 'NR>1 && $6=="true" {c++} END {print c+0}' "$BOOTH_ADMIN_EXPORT_FILE")
  log_ok "부스 관리자 비밀번호 준비 완료 (${ready_count}개)"
}

seed_synthetic_report_data() {
  local sql_file="/tmp/demo_report_seed_${EVENT_ID}.sql"
  local analyzed_at
  analyzed_at=$(date '+%Y-%m-%d %H:%M:%S')
  local total_visitors=$((VU_COUNT * ITERATIONS))
  local total_registrations=$((total_visitors * 58 / 100))

  cat > "$sql_file" <<EOF
DELETE FROM event_summary_results WHERE event_id = ${EVENT_ID};
DELETE FROM booth_performance_results WHERE event_id = ${EVENT_ID};
DELETE FROM hourly_traffic_results WHERE event_id = ${EVENT_ID};
DELETE FROM visitor_path_results WHERE event_id = ${EVENT_ID};
DELETE FROM problem_spot_results WHERE event_id = ${EVENT_ID};

INSERT INTO event_summary_results
  (event_id, total_visitors, total_registrations, avg_waiting_seconds, overall_dropout_rate, peak_hour, analyzed_at)
VALUES
  (${EVENT_ID}, ${total_visitors}, ${total_registrations}, 420.0, 21.3, '14', '${analyzed_at}');
EOF

  for i in "${!BOOTH_IDS[@]}"; do
    local booth_id="${BOOTH_IDS[$i]}"
    local booth_name="${BOOTH_NAMES[$i]}"
    local view_count=$((200 + i * 25))
    local register_count=$((90 + i * 10))
    local dropout_count=$((20 + i * 2))
    local conversion_rate
    local dropout_rate
    conversion_rate=$(python3 - <<PY
v=${view_count}
r=${register_count}
print(round((r / v) * 100, 1))
PY
)
    dropout_rate=$(python3 - <<PY
r=${register_count}
d=${dropout_count}
print(round((d / r) * 100, 1))
PY
)
    cat >> "$sql_file" <<EOF
INSERT INTO booth_performance_results
  (event_id, booth_id, booth_name, view_count, register_count, dropout_count, conversion_rate, dropout_rate, analyzed_at)
VALUES
  (${EVENT_ID}, ${booth_id}, '${booth_name}', ${view_count}, ${register_count}, ${dropout_count}, ${conversion_rate}, ${dropout_rate}, '${analyzed_at}');
EOF
  done

  cat >> "$sql_file" <<EOF
INSERT INTO hourly_traffic_results (event_id, datetime_hour, active_user_count, register_count, analyzed_at) VALUES
(${EVENT_ID}, '2026-03-26 10', 85, 31, '${analyzed_at}'),
(${EVENT_ID}, '2026-03-26 11', 120, 44, '${analyzed_at}'),
(${EVENT_ID}, '2026-03-26 12', 140, 53, '${analyzed_at}'),
(${EVENT_ID}, '2026-03-26 13', 170, 61, '${analyzed_at}'),
(${EVENT_ID}, '2026-03-26 14', 210, 79, '${analyzed_at}'),
(${EVENT_ID}, '2026-03-26 15', 160, 55, '${analyzed_at}');

INSERT INTO visitor_path_results (event_id, path_string, visitor_count, analyzed_at) VALUES
(${EVENT_ID}, '삼성전자 > LG전자 > 네이버', 42, '${analyzed_at}'),
(${EVENT_ID}, '카카오 > 토스 > 당근마켓', 35, '${analyzed_at}'),
(${EVENT_ID}, '현대자동차 > SK하이닉스 > 쿠팡', 28, '${analyzed_at}');

INSERT INTO problem_spot_results (event_id, issue_type, target_id, target_name, severity, issue_metric, description, analyzed_at) VALUES
(${EVENT_ID}, 'HIGH_DROPOUT_BOOTH', '${BOOTH_IDS[0]}', '${BOOTH_NAMES[0]}', 'MEDIUM', 28.4, '호출 후 QR 미등록 비율이 높습니다.', '${analyzed_at}'),
(${EVENT_ID}, 'QUEUE_CONGESTION_HOUR', '2026-03-26 14', '14시 시간대', 'HIGH', 210, '14시 시간대 활성 사용자 급증으로 대기열 혼잡이 발생했습니다.', '${analyzed_at}');
EOF

  run_sql_file "$sql_file" >/dev/null 2>&1 || true
  rm -f "$sql_file"
}

# ─── Banner ──────────────────────────────────────────────────────────────────

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║           Freeline 시연용 데이터 셋업 스크립트          ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  행사명:   ${EVENT_NAME}"
echo "║  방문자:   ${VU_COUNT}명 × ${ITERATIONS}회 시뮬레이션"
echo "║  자동종료: ${AUTO_CLOSE}"
echo "║  리포트:   ${AUTO_REPORT}"
echo "║  부스계정: ${SEED_BOOTH_ADMINS}"
echo "║  ReadyPack:${READY_PACK}"
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

if [ "$AUTO_CLOSE" = "true" ] || [ "$AUTO_REPORT" = "true" ]; then
  DATE_RANGE=$(python3 - <<'PY'
from datetime import date, timedelta
today = date.today()
start = today - timedelta(days=3)
end = today
print(start.isoformat(), end.isoformat())
PY
)
else
  DATE_RANGE=$(python3 - <<'PY'
from datetime import date, timedelta
today = date.today()
end = today + timedelta(days=7)
print(today.isoformat(), end.isoformat())
PY
)
fi
START_DATE=$(echo "$DATE_RANGE" | awk '{print $1}')
END_DATE=$(echo "$DATE_RANGE" | awk '{print $2}')

EVENT_RESP=$(api_post "/api/v1/events" \
  "{\"name\":\"${EVENT_NAME}\",\"description\":\"대한민국 대표 IT기업들이 한자리에 모이는 채용 박람회입니다. 다양한 부스에서 채용 상담과 기업 소개를 받아보세요.\",\"startDate\":\"${START_DATE}\",\"endDate\":\"${END_DATE}\",\"openTime\":\"09:00:00\",\"closeTime\":\"18:00:00\",\"locationAddress\":\"서울특별시 강남구 테헤란로 212 멀티캠퍼스\"}" \
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
# Step 4: 부스 관리자 계정 생성 (옵션)
# ═══════════════════════════════════════════════════════════════════════════════

if [ "$SEED_BOOTH_ADMINS" = "true" ]; then
  log_step "4" "부스 관리자 계정 생성"
  create_booth_admin_accounts
  if [ "$SET_BOOTH_ADMIN_PASSWORDS" = "true" ]; then
    apply_standard_booth_admin_passwords
  fi
else
  log_step "4" "부스 관리자 계정 생성 건너뜀"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# Step 5: 방문자 DB 생성
# ═══════════════════════════════════════════════════════════════════════════════

log_step "5" "방문자 ${VU_COUNT}명 DB 생성"

KOREAN_NAMES=("김민수" "이서연" "박지호" "최유진" "정도현" "강수빈" "조현우" "윤서영" "임재현" "한예린"
              "송민지" "오태양" "배은서" "홍준혁" "류하은" "문성민" "신유나" "권도윤" "황지우" "전소율"
              "장민재" "안서현" "서준호" "남지안" "유하윤" "구민서" "노태현" "양수아" "하지훈" "손예나"
              "김태윤" "이하린" "박준서" "최서아" "정민호" "강은우" "조하영" "윤재민" "임소희" "한도영"
              "송유진" "오서윤" "배준혁" "홍지아" "류민재" "문수현" "신태양" "권서영" "황도현" "전유나")
NAME_COUNT=${#KOREAN_NAMES[@]}

ENTRY_PREFIX="E${EVENT_ID}_"
BATCH_SIZE=500
SQL_FILE="/tmp/demo_visitors_${EVENT_ID}.sql"
> "$SQL_FILE"

BATCH_VALUES=""
BATCH_N=0
for i in $(seq 1 "${VU_COUNT}"); do
  CODE=$(printf "${ENTRY_PREFIX}%03d" "$i")
  NAME_IDX=$(( (i - 1) % NAME_COUNT ))
  VISITOR_NAME="${KOREAN_NAMES[$NAME_IDX]}"
  if [ -n "$BATCH_VALUES" ]; then BATCH_VALUES="${BATCH_VALUES},"; fi
  BATCH_VALUES="${BATCH_VALUES}(${EVENT_ID},'${CODE}','${VISITOR_NAME}',true,NOW(),NOW())"
  BATCH_N=$((BATCH_N + 1))

  if [ "$BATCH_N" -ge "$BATCH_SIZE" ]; then
    echo "INSERT INTO visitors (event_id,entry_code,name,is_active,created_at,updated_at) VALUES ${BATCH_VALUES} ON CONFLICT (entry_code) DO NOTHING;" >> "$SQL_FILE"
    BATCH_VALUES=""
    BATCH_N=0
  fi
done
# 남은 건 flush
if [ -n "$BATCH_VALUES" ]; then
  echo "INSERT INTO visitors (event_id,entry_code,name,is_active,created_at,updated_at) VALUES ${BATCH_VALUES} ON CONFLICT (entry_code) DO NOTHING;" >> "$SQL_FILE"
fi

run_sql_file "$SQL_FILE" 2>&1 || true
rm -f "$SQL_FILE"

AFTER_COUNT=$(run_sql "SELECT COUNT(*) FROM visitors WHERE event_id = ${EVENT_ID};" 2>/dev/null || echo "0")
log_ok "방문자 ${AFTER_COUNT}명 생성 완료"

# ═══════════════════════════════════════════════════════════════════════════════
# Step 6: 지도/부스 이미지 업로드 + 행사 OPEN
# ═══════════════════════════════════════════════════════════════════════════════

log_step "6" "지도/부스 이미지 업로드 + 행사 OPEN"

DUMMY_PNG="/tmp/demo_map_${EVENT_ID}.png"
UPLOAD_IMAGE_PATH="$MAP_IMAGE_FILE"

if [ ! -f "$UPLOAD_IMAGE_PATH" ]; then
  log_warn "MAP_IMAGE_FILE 미존재: ${MAP_IMAGE_FILE} (더미 이미지로 대체)"
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
  UPLOAD_IMAGE_PATH="$DUMMY_PNG"
fi

curl -s -X POST "${TARGET_URL}/api/v1/boothmaps/events/${EVENT_ID}/image" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -F "file=@${UPLOAD_IMAGE_PATH};type=image/png" > /dev/null 2>&1 || true

for booth_id in "${BOOTH_IDS[@]}"; do
  curl -s -X POST "${TARGET_URL}/api/v1/booths/${booth_id}/image/representative" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    -F "file=@${UPLOAD_IMAGE_PATH};type=image/png" > /dev/null 2>&1 || true
done

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
# Step 7: k6 방문자 시뮬레이션
# ═══════════════════════════════════════════════════════════════════════════════

log_step "7" "방문자 시뮬레이션 (k6: ${VU_COUNT} VU × ${ITERATIONS} iterations)"

K6_ENV="-e TARGET_URL=${TARGET_URL} -e ADMIN_ID=${ADMIN_ID} -e ADMIN_PW=${ADMIN_PW} -e VU_COUNT=${VU_COUNT} -e ITERATIONS=${ITERATIONS} -e PRESET_EVENT_ID=${EVENT_ID} -e PRESET_BOOTH_IDS=${BOOTH_IDS_CSV} -e ENTRY_PREFIX=${ENTRY_PREFIX}"
K6_OUT="--out experimental-prometheus-rw"

K6_OK=false
if ssh -o ConnectTimeout=5 "${HDFS_SERVER}" "docker ps --format '{{.Names}}' | grep -q k6-manager" 2>/dev/null; then
  log_info "Server B k6-manager에서 실행..."
  K6_RESULT=$(ssh "${HDFS_SERVER}" "docker exec k6-manager k6 run ${K6_OUT} ${K6_ENV} /scripts/e2e-report-test.js" 2>&1) || true
  K6_OK=true
elif command -v k6 &>/dev/null; then
  log_info "로컬 k6로 실행..."
  K6_RESULT=$(k6 run ${K6_ENV} "${SCRIPT_DIR}/e2e-report-test.js" 2>&1) || true
  K6_OK=true
elif docker ps --format '{{.Names}}' 2>/dev/null | grep -q '^k6-manager$'; then
  log_info "로컬 k6-manager 컨테이너에서 실행..."
  K6_RESULT=$(docker exec k6-manager k6 run ${K6_OUT} ${K6_ENV} /scripts/e2e-report-test.js 2>&1) || true
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
# Step 8: 액션 로그 → HDFS 적재
# ═══════════════════════════════════════════════════════════════════════════════

log_step "8" "액션 로그 → HDFS 적재"

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
# Step 9: 행사 CLOSED (옵션)
# ═══════════════════════════════════════════════════════════════════════════════

if [ "$AUTO_CLOSE" = "true" ]; then
  log_step "9" "행사 CLOSED 변경"
  CLOSE_RESP=$(api_patch "/api/v1/events/${EVENT_ID}" '{"status":"CLOSED"}' "$ADMIN_TOKEN")
  parse_response "$CLOSE_RESP"
  if [ "$RESP_CODE" = "200" ]; then
    log_ok "행사 CLOSED 완료"
  else
    log_warn "행사 CLOSED 실패 — 시연 시 수동으로 변경하세요"
  fi
else
  log_step "9" "행사 상태 유지 (OPEN)"
  log_info "시연 시 직접 행사를 종료하고 리포트를 생성하세요"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# Step 10: 리포트 생성 (옵션)
# ═══════════════════════════════════════════════════════════════════════════════

REPORT_FINAL_STATUS="NOT_STARTED"
REPORT_AVAILABLE="false"

if [ "$AUTO_REPORT" = "true" ]; then
  log_step "10" "리포트 생성 및 상태 폴링"

  # 리포트 생성은 CLOSED 상태에서만 가능하므로 보정합니다.
  if [ "$AUTO_CLOSE" != "true" ]; then
    CLOSE_RESP=$(api_patch "/api/v1/events/${EVENT_ID}" '{"status":"CLOSED"}' "$ADMIN_TOKEN")
    parse_response "$CLOSE_RESP"
    if [ "$RESP_CODE" = "200" ]; then
      log_info "리포트 생성을 위해 행사 상태를 CLOSED로 변경했습니다"
    else
      log_warn "행사 CLOSED 전환 실패 (HTTP ${RESP_CODE})"
    fi
  fi

  GEN_RESP=$(api_post "/api/v1/reports/events/${EVENT_ID}/generate" '{}' "$ADMIN_TOKEN")
  parse_response "$GEN_RESP"
  if [ "$RESP_CODE" = "200" ] || [ "$RESP_CODE" = "202" ]; then
    REPORT_FINAL_STATUS="PENDING"
    log_info "리포트 생성 요청 성공"

    ELAPSED=0
    while [ "$ELAPSED" -lt "$REPORT_POLL_MAX_WAIT" ]; do
      STATUS_RESP=$(curl -s -w '\n%{http_code}' -X GET \
        "${TARGET_URL}/api/v1/reports/events/${EVENT_ID}/status" \
        -H "Authorization: Bearer ${ADMIN_TOKEN}")
      parse_response "$STATUS_RESP"

      if [ "$RESP_CODE" = "200" ]; then
        CURRENT_STATUS=$(extract_json_field "$RESP_BODY" "status")
        REPORT_FINAL_STATUS="$CURRENT_STATUS"
        if [ "$CURRENT_STATUS" = "COMPLETED" ]; then
          REPORT_AVAILABLE="true"
          log_ok "리포트 생성 완료 (${ELAPSED}초)"
          break
        fi
        if [ "$CURRENT_STATUS" = "FAILED" ]; then
          log_warn "리포트 생성 실패 상태(FAILED)를 확인했습니다"
          break
        fi
      fi

      sleep "$REPORT_POLL_INTERVAL"
      ELAPSED=$((ELAPSED + REPORT_POLL_INTERVAL))
    done
  else
    log_warn "리포트 생성 요청 실패 (HTTP ${RESP_CODE})"
  fi

  if [ "$REPORT_AVAILABLE" != "true" ] && [ "$REPORT_FALLBACK_SEED" = "true" ]; then
    log_warn "리포트 생성 미완료로 synthetic 리포트 시드 데이터를 주입합니다"
    seed_synthetic_report_data
    REPORT_FINAL_STATUS="FALLBACK_SEEDED"
    REPORT_AVAILABLE="true"
  fi

  if [ "$REPORT_AVAILABLE" = "true" ]; then
    REPORT_VIEW_RESP=$(curl -s -w '\n%{http_code}' -X GET \
      "${TARGET_URL}/api/v1/reports/events/${EVENT_ID}" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}")
    parse_response "$REPORT_VIEW_RESP"
    if [ "$RESP_CODE" = "200" ]; then
      log_ok "리포트 조회 가능 상태 확인"
    else
      log_warn "리포트 조회 확인 실패 (HTTP ${RESP_CODE})"
      REPORT_AVAILABLE="false"
    fi
  fi
fi

OUTPUT_DIR="${SCRIPT_DIR}/../output"
mkdir -p "$OUTPUT_DIR"
PROFILE_FILE="${OUTPUT_DIR}/demo-profile-event-${EVENT_ID}.md"
DEMO_EVENT_STATUS="OPEN"
if [ "$AUTO_CLOSE" = "true" ] || [ "$AUTO_REPORT" = "true" ]; then
  DEMO_EVENT_STATUS="CLOSED"
fi

{
  echo "# Freeline Demo Profile"
  echo ""
  echo "- GeneratedAt: $(date '+%Y-%m-%d %H:%M:%S')"
  echo "- EventId: ${EVENT_ID}"
  echo "- EventName: ${EVENT_NAME}"
  echo "- EventStatus: ${DEMO_EVENT_STATUS}"
  echo "- ReportStatus: ${REPORT_FINAL_STATUS}"
  echo "- ReportAvailable: ${REPORT_AVAILABLE}"
  echo ""
  echo "## Event Admin Account"
  echo "- LoginId: ${ADMIN_ID}"
  echo "- Password: ${ADMIN_PW}"
  echo ""
  echo "## Booth Admin Accounts"
  if [ -f "${BOOTH_ADMIN_EXPORT_FILE:-}" ]; then
    echo "| BoothId | BoothName | LoginId | Email | Password | Ready |"
    echo "|---|---|---|---|---|---|"
    awk -F'\t' 'NR>1 {printf("| %s | %s | %s | %s | %s | %s |\n",$1,$2,$3,$4,$5,$6)}' "$BOOTH_ADMIN_EXPORT_FILE"
  else
    echo "- (부스 관리자 계정을 생성하지 않았습니다)"
  fi
} > "$PROFILE_FILE"

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
echo -e "${CYAN}║${NC}  현재 상태:   ${DEMO_EVENT_STATUS}"
echo -e "${CYAN}║${NC}  리포트 상태: ${REPORT_FINAL_STATUS}"
echo -e "${CYAN}║${NC}  프로필 파일: ${PROFILE_FILE}"
echo -e "${CYAN}║${NC}"
echo -e "${CYAN}╠══════════════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║${NC}  ${YELLOW}시연 순서:${NC}"

if [ "$AUTO_REPORT" = "true" ] && [ "$REPORT_AVAILABLE" = "true" ]; then
  echo -e "${CYAN}║${NC}    1. 관리자 대시보드에서 행사 '${EVENT_NAME}' 선택"
  echo -e "${CYAN}║${NC}    2. 리포트 탭에서 즉시 결과 확인"
  echo -e "${CYAN}║${NC}    3. 부스 관리자 계정으로 /booth 로그인 후 내 부스 리포트 확인"
elif [ "$AUTO_CLOSE" = "true" ]; then
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
if [ -f "${BOOTH_ADMIN_EXPORT_FILE:-}" ]; then
  echo -e "${CYAN}║${NC}    - 부스 관리자 계정은 output 프로필 파일 참조"
fi
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
