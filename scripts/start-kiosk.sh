#!/bin/bash

# Portal Kiosk Launcher
# Edit PEER_SERVER_HOST before running

PEER_SERVER_HOST="YOUR_ORACLE_VM_IP"
PEER_SERVER_PORT="9000"
URL="http://${PEER_SERVER_HOST}:${PEER_SERVER_PORT}/client/index.html"

# Kill any existing Chromium processes
pkill -f chromium || true
pkill -f chrome || true

sleep 2

# Launch Chromium in kiosk mode
chromium-browser \
  --kiosk \
  --autoplay-policy=no-user-gesture-required \
  --disable-infobars \
  --noerrdialogs \
  --check-for-update-interval=31536000 \
  --disable-translate \
  --disable-features=TranslateUI \
  --disable-session-crashed-bubble \
  --disable-restore-session-state \
  --use-fake-ui-for-media-stream \
  "$URL" &

echo "Kiosk started at $(date)"
