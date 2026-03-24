#!/bin/sh
# 롤링 완료된 로그 파일을 Flume spooldir로 이동
# 현재 쓰기 중인 action.log는 제외하고, 시간별 롤링 파일만 이동

LOG_DIR="/var/log/action/source"
SPOOL_DIR="/var/log/action/spool"

mkdir -p "$SPOOL_DIR"

while true; do
    # action.YYYY-MM-DD-HH.log 패턴만 이동
    # -mmin +5: 5분 이상 수정 없는 파일만 (롤링 완료 보장)
    find "$LOG_DIR" -name "action.*.log" -mmin +5 2>/dev/null | while read -r file; do
        if mv "$file" "$SPOOL_DIR/" 2>/dev/null; then
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] Moved: $(basename "$file")"
        else
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] Failed to move: $(basename "$file")" >&2
        fi
    done
    sleep 60
done
