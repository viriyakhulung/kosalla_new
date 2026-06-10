#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

HOST="0.0.0.0"
PORT="8000"
LOG_DIR="storage/logs"
LOG_FILE="${LOG_DIR}/artisan-serve.log"
PID_FILE="artisan-serve.pid"

mkdir -p "$LOG_DIR"

if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "Artisan serve masih running (PID $(cat "$PID_FILE")). Stop dulu atau hapus PID."
  exit 1
fi

nohup php artisan serve --host="$HOST" --port="$PORT" >> "$LOG_FILE" 2>&1 &
echo $! > "$PID_FILE"

echo "Started: php artisan serve --host=$HOST --port=$PORT"
echo "PID: $(cat "$PID_FILE")"
echo "Log: $LOG_FILE"

