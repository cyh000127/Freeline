#!/usr/bin/env bash
# ============================================================================
# E2E 테스트 통합 실행 스크립트
#
# Infisical에서 시크릿을 주입받아 테스트 스크립트를 실행합니다.
# 별도 환경변수 설정 없이 이 스크립트 하나만 실행하면 됩니다.
#
# 사용법:
#   ./run.sh                          # E2E 리포트 파이프라인 전체 검증
#   ./run.sh demo                     # 시연용 데이터 셋업
#   ./run.sh demo --auto-close        # 시연용 + 행사 자동 CLOSED
#   ./run.sh demo --ready-pack        # 시연용 완성형(계정/리포트 포함)
#   ./run.sh stress                   # 고도화 부하 테스트 (ramping + spike)
#
#   VU_COUNT=1000 ITERATIONS=5 ./run.sh           # 대규모 E2E 테스트
#   PEAK_VUS=200 SPIKE_VUS=500 ./run.sh stress    # 고부하 스트레스 테스트
#
# Infisical 접속 정보:
#   INFISICAL_URL, INFISICAL_PROJECT_ID, INFISICAL_CLIENT_ID,
#   INFISICAL_CLIENT_SECRET 환경변수가 없으면 기본값을 사용합니다.
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ─── Infisical 설정 ──────────────────────────────────────────────────────────

INFISICAL_URL="${INFISICAL_URL:-https://j14a207.p.ssafy.io:8443}"
INFISICAL_ENV="${INFISICAL_ENV:-prod}"
INFISICAL_PATH="${INFISICAL_PATH:-/be}"

# ─── Infisical 사용 가능 여부 확인 ───────────────────────────────────────────

if ! command -v infisical &>/dev/null; then
  echo "ERROR: infisical CLI가 설치되어 있지 않습니다."
  echo "  https://infisical.com/docs/cli/overview 참고"
  exit 1
fi

# ─── 실행할 스크립트 결정 ─────────────────────────────────────────────────────

MODE="${1:-e2e}"
shift 2>/dev/null || true

case "$MODE" in
  demo)
    TARGET_SCRIPT="${SCRIPT_DIR}/scripts/demo-setup.sh"
    ;;
  e2e|verify)
    TARGET_SCRIPT="${SCRIPT_DIR}/scripts/e2e-report-verify.sh"
    ;;
  stress)
    TARGET_SCRIPT="${SCRIPT_DIR}/scripts/stress-setup.sh"
    ;;
  *)
    echo "사용법: $0 [e2e|demo|stress] [추가 옵션]"
    echo "  e2e    — E2E 리포트 파이프라인 전체 검증 (기본)"
    echo "  demo   — 시연용 데이터 셋업 (--auto-close/--auto-report/--ready-pack 옵션 가능)"
    echo "  stress — 고도화 부하 테스트 (ramping VU + spike 시나리오)"
    exit 1
    ;;
esac

if [ ! -x "$TARGET_SCRIPT" ]; then
  echo "ERROR: ${TARGET_SCRIPT} 파일이 없거나 실행 권한이 없습니다."
  exit 1
fi

# ─── Infisical로 시크릿 주입 + 스크립트 실행 ──────────────────────────────────

echo "━━━ Infisical 시크릿 주입 (env=${INFISICAL_ENV}, path=${INFISICAL_PATH}) ━━━"

exec infisical run \
  --domain="${INFISICAL_URL}/api" \
  --env="${INFISICAL_ENV}" \
  --path="${INFISICAL_PATH}" \
  -- "${TARGET_SCRIPT}" "$@"
