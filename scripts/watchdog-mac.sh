#!/bin/bash

# Portal Watchdog for macOS
# Monitors Chrome and restarts if it crashes

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="${SCRIPT_DIR}/watchdog-mac.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Watchdog started"

while true; do
  if ! pgrep -f "Google Chrome.*--kiosk" > /dev/null; then
    log "Chrome kiosk not running, restarting..."
    "${SCRIPT_DIR}/start-kiosk-mac.sh"
    log "Chrome restarted"
  fi

  sleep 30
done
