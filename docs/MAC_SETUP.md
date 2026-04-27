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

# Download scripts directly to portal directory
cd /Users/Shared/portal
sudo curl -O https://raw.githubusercontent.com/DE-YAN-Studio/DY-Portal/master/scripts/start-kiosk-mac.sh
sudo curl -O https://raw.githubusercontent.com/DE-YAN-Studio/DY-Portal/master/scripts/watchdog-mac.sh
sudo chmod +x /Users/Shared/portal/*.sh

# Create Chrome data directory with proper permissions
sudo mkdir -p /Users/Shared/portal/chrome-data
sudo chmod 777 /Users/Shared/portal/chrome-data
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

### Option A: Login Items (Recommended)

1. Open **Automator** (Cmd + Space, type "Automator")
2. Choose **Application**
3. Search for "Run Shell Script" and drag it to the workflow
4. Enter: `/Users/Shared/portal/watchdog-mac.sh`
5. **File > Save** as `Portal Watchdog.app` to your **Applications** folder
6. Open **System Settings** > **General** > **Login Items**
7. Click **+** under "Open at Login"
8. Navigate to **Applications** and select `Portal Watchdog.app`

### Option B: LaunchAgent

```bash
# Create the plist (copy content from scripts/com.portal.watchdog.plist)
nano ~/Library/LaunchAgents/com.portal.watchdog.plist

# Load it
launchctl load ~/Library/LaunchAgents/com.portal.watchdog.plist
```

The watchdog will now:
- Start automatically on boot
- Monitor Chrome every 30 seconds
- Restart Chrome if it crashes

## Step 6: Configure Mac for Kiosk Use

### Disable Sleep

1. **System Settings** > **Displays** > **Advanced...**
2. Turn **on** "Prevent automatic sleeping when the display is off"
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
# If using LaunchAgent:
launchctl unload ~/Library/LaunchAgents/com.portal.watchdog.plist

# If using Login Items, remove from System Settings > General > Login Items
# Then kill the running process:
pkill -f watchdog-mac.sh
```

### Check watchdog logs

```bash
cat /Users/Shared/portal/watchdog-mac.log
```

### Restart everything

```bash
# Stop watchdog
pkill -f watchdog-mac.sh

# Kill Chrome
pkill -f "Google Chrome"

# Restart watchdog (will relaunch Chrome)
/Users/Shared/portal/watchdog-mac.sh &
```

### Clear saved cookies (reset login/office)

```bash
# Quit Chrome first, then:
sudo rm -rf /Users/Shared/portal/chrome-data
```

## Quick Reference

| Action | Command |
|--------|---------|
| Start kiosk manually | `/Users/Shared/portal/start-kiosk-mac.sh` |
| Stop watchdog | `pkill -f watchdog-mac.sh` |
| Start watchdog manually | `/Users/Shared/portal/watchdog-mac.sh &` |
| View logs | `cat /Users/Shared/portal/watchdog-mac.log` |
| Exit kiosk | `Cmd + Q` |
