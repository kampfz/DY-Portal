# Mac Mini Portal Setup Guide

Complete setup guide for running the Portal on a Mac Mini as a dedicated always-on display.

## Prerequisites

- Mac Mini with macOS
- Google Chrome installed
- Network connection
- Portal password (get from admin)

## Step 1: Install Google Chrome

If Chrome isn't installed:

1. Download from https://www.google.com/chrome/
2. Drag to Applications folder
3. Open once to accept permissions

## Step 2: Download Portal Scripts

Open Terminal (Cmd + Space, type "Terminal") and run:

```bash
# Create portal directory
sudo mkdir -p /Users/Shared/portal
cd /Users/Shared/portal

# Download scripts
curl -O https://raw.githubusercontent.com/DE-YAN-Studio/DY-Portal/master/scripts/start-kiosk-mac.sh
curl -O https://raw.githubusercontent.com/DE-YAN-Studio/DY-Portal/master/scripts/watchdog-mac.sh

# Make executable
chmod +x *.sh
```

## Step 3: Grant Chrome Camera/Microphone Access

1. Open **System Settings** > **Privacy & Security**
2. Click **Camera** > Enable for **Google Chrome**
3. Click **Microphone** > Enable for **Google Chrome**

## Step 4: First Run (Manual Login)

Run the kiosk script manually to log in and select your office:

```bash
/Users/Shared/portal/start-kiosk-mac.sh
```

Chrome will open in kiosk mode. You'll need to:

1. Enter the portal password
2. Select your office (New York or Serbia)

These are saved as cookies and won't be asked again.

**To exit kiosk mode:** Press `Cmd + Q` or `Cmd + W`

## Step 5: Enable Auto-Start on Boot

Download and install the LaunchAgent:

```bash
# Download the plist
cd /Users/Shared/portal
curl -O https://raw.githubusercontent.com/DE-YAN-Studio/DY-Portal/master/scripts/com.portal.watchdog.plist

# Copy to LaunchAgents
cp com.portal.watchdog.plist ~/Library/LaunchAgents/

# Load it (starts immediately)
launchctl load ~/Library/LaunchAgents/com.portal.watchdog.plist
```

The watchdog will now:
- Start automatically on boot
- Monitor Chrome every 30 seconds
- Restart Chrome if it crashes

## Step 6: Configure Mac for Kiosk Use

### Disable Sleep

1. **System Settings** > **Displays** > **Advanced...**
2. Turn off "Prevent automatic sleeping when the display is off"
3. **System Settings** > **Lock Screen**
4. Set "Turn display off when inactive" to **Never**
5. Set "Require password after screen saver" to **Never**

### Auto-Login (Optional)

1. **System Settings** > **Users & Groups**
2. Click **Login Options** (at bottom)
3. Set "Automatic login" to your user account

### Hide Menu Bar and Dock (Optional)

1. **System Settings** > **Desktop & Dock**
2. Enable "Automatically hide and show the Dock"
3. **System Settings** > **Control Center**
4. Set "Automatically hide and show the menu bar" to **Always**

### Disable Notifications

1. **System Settings** > **Notifications**
2. Turn off notifications for all apps, or enable **Do Not Disturb**

## Troubleshooting

### Chrome won't start

Check if Chrome is installed:
```bash
ls "/Applications/Google Chrome.app"
```

### Camera not working

1. Check camera permissions in System Settings
2. Make sure no other app is using the camera
3. Try unplugging and replugging external cameras

### Portal stuck on "Calling..."

1. Check internet connection
2. Verify the other office is online
3. Check https://dy-portal.duckdns.org/health for connected peers

### Stop the watchdog

```bash
launchctl unload ~/Library/LaunchAgents/com.portal.watchdog.plist
```

### Check watchdog logs

```bash
cat /Users/Shared/portal/watchdog-mac.log
```

### Restart everything

```bash
# Stop watchdog
launchctl unload ~/Library/LaunchAgents/com.portal.watchdog.plist

# Kill Chrome
pkill -f "Google Chrome"

# Restart watchdog (will relaunch Chrome)
launchctl load ~/Library/LaunchAgents/com.portal.watchdog.plist
```

### Clear saved cookies (reset login/office)

```bash
# Quit Chrome first, then:
rm -rf ~/Library/Application\ Support/Google/Chrome/Default/Cookies
```

## Quick Reference

| Action | Command |
|--------|---------|
| Start kiosk manually | `/Users/Shared/portal/start-kiosk-mac.sh` |
| Stop watchdog | `launchctl unload ~/Library/LaunchAgents/com.portal.watchdog.plist` |
| Start watchdog | `launchctl load ~/Library/LaunchAgents/com.portal.watchdog.plist` |
| View logs | `cat /Users/Shared/portal/watchdog-mac.log` |
| Exit kiosk | `Cmd + Q` |
