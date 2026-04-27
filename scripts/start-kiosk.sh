#!/bin/bash

# Portal Kiosk Launcher
# Edit URL before running

URL="https://dy-portal.duckdns.org"
USER_DATA_DIR="$HOME/.portal-chrome-data"

# Kill any existing Chromium processes
pkill -f chromium || true
pkill -f chrome || true

sleep 2

# Launch Chromium in kiosk mode with persistent profile
chromium-browser \
  --kiosk \
  --user-data-dir="$USER_DATA_DIR" \
  --autoplay-policy=no-user-gesture-required \
  --disable-infobars \
  --noerrdialogs \
  --check-for-update-interval=31536000 \
  --disable-translate \
  --disable-features=TranslateUI \
  --disable-session-crashed-bubble \
  --use-fake-ui-for-media-stream \
  "$URL" &

echo "Kiosk started at $(date)"
