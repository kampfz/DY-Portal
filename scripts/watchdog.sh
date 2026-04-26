#!/bin/bash

# Portal Watchdog
# Monitors Chromium and restarts if it crashes

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="${SCRIPT_DIR}/watchdog.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Watchdog started"

while true; do
  if ! pgrep -f "chromium.*kiosk" > /dev/null && ! pgrep -f "chrome.*kiosk" > /dev/null; then
    log "Chromium not running, restarting..."
    "${SCRIPT_DIR}/start-kiosk.sh"
    log "Chromium restarted"
  fi

  sleep 30
done
