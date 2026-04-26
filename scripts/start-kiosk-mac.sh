#!/bin/bash

# Portal Kiosk Launcher for macOS
# Run: chmod +x start-kiosk-mac.sh && ./start-kiosk-mac.sh

URL="https://dy-portal.duckdns.org"

# Kill any existing Chrome kiosk instances
pkill -f "Google Chrome.*--kiosk" 2>/dev/null || true

sleep 2

# Launch Chrome in kiosk mode
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --kiosk \
  --autoplay-policy=no-user-gesture-required \
  --disable-infobars \
  --noerrdialogs \
  --check-for-update-interval=31536000 \
  --disable-translate \
  --disable-features=TranslateUI \
  --disable-session-crashed-bubble \
  --disable-restore-session-state \
  "$URL" &

echo "Kiosk started at $(date)"
