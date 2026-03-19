#!/bin/bash
set -euo pipefail

# ─────────────────────────────────────────────
# Infrastructure Volume Backup Script
# Usage: ./backup.sh [component] [backup_dir]
#   component : 특정 컴포넌트만 백업 (생략 시 전체)
#   backup_dir: 백업 저장 경로 (기본: /tmp/infra-backup-YYYYMMDD)
# ─────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INFRA_DIR="$(dirname "$SCRIPT_DIR")"
TARGET_COMPONENT="${1:-all}"
BACKUP_DIR="${2:-/tmp/infra-backup-$(date +%Y%m%d_%H%M%S)}"

mkdir -p "$BACKUP_DIR"

echo "══════════════════════════════════════"
echo "  Infrastructure Volume Backup"
echo "  Target: $TARGET_COMPONENT"
echo "  Backup dir: $BACKUP_DIR"
echo "══════════════════════════════════════"

backup_component() {
    local component=$1
    local component_dir="$INFRA_DIR/$component"

    if [ ! -f "$component_dir/docker-compose.yml" ]; then
        return
    fi

    cd "$component_dir"

    # docker-compose.yml에서 named volume 목록 추출
    local volumes
    volumes=$(docker compose config --volumes 2>/dev/null || true)

    if [ -z "$volumes" ]; then
        echo "⏭️  [$component] No named volumes, skipping"
        return
    fi

    local project
    project=$(docker compose config --format json 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('name',''))" 2>/dev/null || basename "$component_dir")

    echo "📦 [$component] Backing up volumes..."
    for vol in $volumes; do
        local full_vol="${project}_${vol}"
        local backup_file="$BACKUP_DIR/${component}_${vol}.tar.gz"

        # 볼륨이 실제 존재하는지 확인
        if docker volume inspect "$full_vol" &>/dev/null; then
            echo "   💾 $full_vol → $(basename "$backup_file")"
            docker run --rm \
                -v "$full_vol":/data \
                -v "$BACKUP_DIR":/backup \
                alpine tar czf "/backup/${component}_${vol}.tar.gz" -C /data .
        else
            echo "   ⚠️  Volume $full_vol not found, skipping"
        fi
    done
}

restore_component() {
    local component=$1
    local component_dir="$INFRA_DIR/$component"

    if [ ! -f "$component_dir/docker-compose.yml" ]; then
        return
    fi

    cd "$component_dir"

    local volumes
    volumes=$(docker compose config --volumes 2>/dev/null || true)

    if [ -z "$volumes" ]; then
        return
    fi

    local project
    project=$(docker compose config --format json 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('name',''))" 2>/dev/null || basename "$component_dir")

    echo "📥 [$component] Restoring volumes..."
    for vol in $volumes; do
        local full_vol="${project}_${vol}"
        local backup_file="$BACKUP_DIR/${component}_${vol}.tar.gz"

        if [ -f "$backup_file" ]; then
            echo "   💾 $(basename "$backup_file") → $full_vol"
            docker volume create "$full_vol" 2>/dev/null || true
            docker run --rm \
                -v "$full_vol":/data \
                -v "$BACKUP_DIR":/backup \
                alpine sh -c "cd /data && tar xzf /backup/${component}_${vol}.tar.gz"
        else
            echo "   ⚠️  Backup file not found: $backup_file"
        fi
    done
}

# ── Main ──
ACTION="${3:-backup}"

if [ "$TARGET_COMPONENT" = "all" ]; then
    components=$(find "$INFRA_DIR" -maxdepth 2 -name 'docker-compose.yml' -exec dirname {} \; | xargs -I{} basename {} | sort)
else
    components="$TARGET_COMPONENT"
fi

for comp in $components; do
    if [ "$ACTION" = "restore" ]; then
        restore_component "$comp"
    else
        backup_component "$comp"
    fi
done

echo ""
echo "══════════════════════════════════════"
if [ "$ACTION" = "restore" ]; then
    echo "  ✅ Restore completed!"
else
    echo "  ✅ Backup completed!"
    echo "  📁 Files: $BACKUP_DIR"
    ls -lh "$BACKUP_DIR" 2>/dev/null || true
fi
echo "══════════════════════════════════════"
