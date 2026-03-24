#!/bin/bash
set -euo pipefail

# ─────────────────────────────────────────────
# Infrastructure Component Deployment Script
# Usage: ./deploy.sh <component_name>
# ─────────────────────────────────────────────

COMPONENT="${1:-}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INFRA_DIR="$(dirname "$SCRIPT_DIR")"
HEALTH_CHECK_RETRIES=10
HEALTH_CHECK_INTERVAL=3

# ── Validation ──
if [ -z "$COMPONENT" ]; then
    echo "Usage: $0 <component_name>"
    echo "Available components:"
    find "$INFRA_DIR" -maxdepth 2 -name 'docker-compose.yml' -exec dirname {} \; | xargs -I{} basename {} | sort
    exit 1
fi

COMPONENT_DIR="$INFRA_DIR/$COMPONENT"

if [ ! -d "$COMPONENT_DIR" ]; then
    echo "❌ Component directory not found: $COMPONENT_DIR"
    exit 1
fi

if [ ! -f "$COMPONENT_DIR/docker-compose.yml" ]; then
    echo "❌ No docker-compose.yml found in $COMPONENT"
    exit 1
fi

cd "$COMPONENT_DIR"

# ── Config Validation ──
echo "🔍 [$COMPONENT] Validating docker-compose configuration..."
if ! docker compose config > /dev/null 2>&1; then
    echo "❌ [$COMPONENT] Invalid docker-compose.yml"
    docker compose config
    exit 1
fi
echo "✅ [$COMPONENT] Configuration valid"

# ── Capture current state for rollback ──
RUNNING_BEFORE=$(docker compose ps -q 2>/dev/null || true)

# ── Deploy ──
echo "🚀 [$COMPONENT] Starting deployment..."
if ! docker compose up -d --build --remove-orphans; then
    echo "❌ [$COMPONENT] docker compose up failed"
    exit 1
fi

# ── Health Check ──
echo "🏥 [$COMPONENT] Running health checks..."
HEALTHY=true
for i in $(seq 1 $HEALTH_CHECK_RETRIES); do
    sleep $HEALTH_CHECK_INTERVAL

    # Check if all services are running
    UNHEALTHY=$(docker compose ps --format json 2>/dev/null | \
        python3 -c "
import sys, json
for line in sys.stdin:
    line = line.strip()
    if not line: continue
    svc = json.loads(line)
    state = svc.get('State', svc.get('state', ''))
    health = svc.get('Health', svc.get('health', ''))
    if state != 'running' or health == 'unhealthy':
        print(svc.get('Name', svc.get('name', 'unknown')))
" 2>/dev/null || true)

    if [ -z "$UNHEALTHY" ]; then
        echo "✅ [$COMPONENT] All services healthy (attempt $i/$HEALTH_CHECK_RETRIES)"
        HEALTHY=true
        break
    else
        echo "⏳ [$COMPONENT] Waiting for services: $UNHEALTHY (attempt $i/$HEALTH_CHECK_RETRIES)"
        HEALTHY=false
    fi
done

if [ "$HEALTHY" = false ]; then
    echo "⚠️  [$COMPONENT] Some services did not become healthy within timeout."
    echo "    Current status:"
    docker compose ps
    # Don't roll back automatically — just warn. Manual intervention may be needed.
    exit 1
fi

echo "──────────────────────────────────────"
echo "✅ [$COMPONENT] Deployment completed successfully"
docker compose ps
