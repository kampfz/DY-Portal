#!/bin/bash

# Portal Kiosk Launcher for macOS
# Run: chmod +x start-kiosk-mac.sh && ./start-kiosk-mac.sh

URL="https://dy-portal.duckdns.org"
USER_DATA_DIR="/Users/Shared/portal/chrome-data"

# Kill any existing Chrome kiosk instances
pkill -f "Google Chrome.*--kiosk" 2>/dev/null || true

sleep 2

# Launch Chrome in kiosk mode with persistent profile
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --kiosk \
  --user-data-dir="$USER_DATA_DIR" \
  --autoplay-policy=no-user-gesture-required \
  --disable-infobars \
  --noerrdialogs \
  --check-for-update-interval=31536000 \
  --disable-translate \
  --disable-features=TranslateUI \
  --disable-session-crashed-bubble \
  "$URL" &

echo "Kiosk started at $(date)"
