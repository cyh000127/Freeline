#!/bin/bash
set -euo pipefail

# ─────────────────────────────────────────────
# Infrastructure Bootstrap Script
# 새 서버에서 인프라 환경을 초기 구축할 때 사용
# Usage: sudo ./bootstrap.sh
# ─────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INFRA_DIR="$(dirname "$SCRIPT_DIR")"
DEPLOY_SCRIPT="$SCRIPT_DIR/deploy.sh"

echo "══════════════════════════════════════"
echo "  Infrastructure Bootstrap"
echo "══════════════════════════════════════"

# ── Step 1: Docker 설치 확인 ──
echo ""
echo "📦 [1/4] Docker 확인..."
if command -v docker &> /dev/null; then
    echo "✅ Docker already installed: $(docker --version)"
else
    echo "🔧 Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    usermod -aG docker "$USER"
    echo "✅ Docker installed"
fi

if command -v docker compose &> /dev/null || docker compose version &> /dev/null; then
    echo "✅ Docker Compose available"
else
    echo "❌ Docker Compose not found. Please install Docker Compose v2."
    exit 1
fi

# ── Step 2: 네트워크 생성 ──
echo ""
echo "🌐 [2/4] Docker 네트워크 생성..."
"$DEPLOY_SCRIPT" networks

# ── Step 3: 정의된 순서대로 컴포넌트 배포 ──
echo ""
echo "🚀 [3/4] 컴포넌트 배포..."

# 배포 순서 (networks는 위에서 이미 배포)
DEPLOY_ORDER="infisical jenkins backend frontend nginx monitoring"

for component in $DEPLOY_ORDER; do
    COMPONENT_DIR="$INFRA_DIR/$component"
    if [ -d "$COMPONENT_DIR" ] && [ -f "$COMPONENT_DIR/docker-compose.yml" ]; then
        echo ""
        echo "── Deploying: $component ──"
        "$DEPLOY_SCRIPT" "$component" || {
            echo "⚠️  $component 배포 실패. 계속 진행합니다."
        }
    else
        echo "⏭️  $component: docker-compose.yml 없음, 스킵"
    fi
done

# ── Step 4: 최종 상태 확인 ──
echo ""
echo "📊 [4/4] 최종 상태 확인..."
echo ""
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | head -30

echo ""
echo "══════════════════════════════════════"
echo "  ✅ Bootstrap completed!"
echo "══════════════════════════════════════"
