# Portal

An always-on, two-way video portal connecting two offices using WebRTC for peer-to-peer video/audio and PeerJS for signaling.

## Features

- **Real-time video/audio** between two locations
- **Password protection** - login page with session cookies
- **Office selection UI** - choose your location on launch (remembered via cookie)
- **Camera controls** - mute mic, hide local video, rotate orientation, fullscreen
- **Synced rotation** - camera rotation syncs to remote viewer via data channel
- **Auto-hide UI** - controls fade away after 3 seconds, reappear on mouse movement
- **Auto-reconnect** - automatically reconnects on network issues
- **Auto-deploy** - GitHub Actions deploys on every push
- **HTTPS/WSS** - secure connections via Caddy reverse proxy
- **Kiosk mode** - scripts for dedicated always-on displays

## Architecture

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│  Office NY  │◄───────►│  Oracle Cloud VM │◄───────►│  Serbia     │
│  (Browser)  │  WebRTC │  (PeerJS Server) │  WebRTC │  (Browser)  │
└─────────────┘         │  + Caddy (HTTPS) │         └─────────────┘
                        └──────────────────┘
```

- **PeerJS Server**: Handles WebRTC signaling (peer discovery, connection setup)
- **Caddy**: Provides HTTPS/WSS with automatic Let's Encrypt certificates
- **WebRTC**: Direct peer-to-peer video/audio (media doesn't go through server)

## Controls

| Button | Function |
|--------|----------|
| 🎤 | Mute/unmute microphone |
| 📷 | Show/hide local video preview |
| 🔄 | Rotate video orientation |
| ⛶ | Toggle fullscreen |
| 🌐 | Change office |

## Quick Start

### 1. Deploy the signaling server

```bash
# On your server (e.g., Oracle Cloud free tier VM)
cd server
npm install
PORTAL_PASSWORD=yourpassword pm2 start server.js --name portal-server
pm2 save
```

Set `PORTAL_PASSWORD` to your desired login password.

### 2. Set up HTTPS (required for camera access)

```bash
# Install Caddy
sudo apt install -y caddy

# Configure reverse proxy (replace with your domain)
echo 'your-domain.duckdns.org {
    reverse_proxy localhost:9000
}' | sudo tee /etc/caddy/Caddyfile

sudo systemctl restart caddy
```

### 3. Update client config

Edit `client/config.js`:

```js
PEER_SERVER_HOST: 'your-domain.duckdns.org',
PEER_SERVER_PORT: 443,
```

### 4. Open firewall ports

- Port 443 (HTTPS) - for web traffic
- Port 9000 (optional) - direct access to PeerJS

### 5. Access the portal

Open `https://your-domain.duckdns.org` - you'll be prompted to log in, then redirected to the portal.

## Project Structure

```
portal/
├── .github/
│   └── workflows/
│       └── deploy.yml      # Auto-deploy on push
├── server/
│   ├── package.json
│   └── server.js           # PeerJS signaling server
├── client/
│   ├── index.html          # UI with office selection
│   ├── login.html          # Password login page
│   ├── main.js             # WebRTC + PeerJS client
│   ├── style.css
│   └── config.js           # Server connection settings
├── scripts/
│   ├── start-kiosk.sh      # Chromium kiosk mode launcher
│   └── watchdog.sh         # Auto-restart on crash
└── README.md
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/` | Redirects to login or portal |
| `/login` | Login page |
| `/api/login` | POST: authenticate with password |
| `/api/logout` | POST: clear session |
| `/health` | Health check: `{ status, peers, peerIds }` |
| `/client/` | Portal web client (requires auth) |
| `/peerjs` | PeerJS WebSocket endpoint |

## Auto-Deploy Setup

The repo includes a GitHub Actions workflow for automatic deployment. To enable:

1. Go to **Settings > Secrets and variables > Actions**
2. Add these secrets:
   - `SERVER_HOST`: Your server's IP address
   - `SSH_PRIVATE_KEY`: Your SSH private key contents

Every push to `master` will automatically deploy to your server.

## Kiosk Mode (Linux)

For dedicated always-on displays:

```bash
# Edit PEER_SERVER_HOST in start-kiosk.sh first
chmod +x scripts/*.sh
./scripts/start-kiosk.sh

# Run watchdog in background
nohup ./scripts/watchdog.sh &
```

## Kiosk Mode (macOS)

For Mac Mini displays, see the full setup guide: **[docs/MAC_SETUP.md](docs/MAC_SETUP.md)**

Quick start:

```bash
# Download scripts
sudo mkdir -p /Users/Shared/portal/chrome-data && cd /Users/Shared/portal
sudo curl -O https://raw.githubusercontent.com/DE-YAN-Studio/DY-Portal/master/scripts/start-kiosk-mac.sh
sudo curl -O https://raw.githubusercontent.com/DE-YAN-Studio/DY-Portal/master/scripts/watchdog-mac.sh
sudo chmod +x /Users/Shared/portal/*.sh
sudo chmod 777 /Users/Shared/portal/chrome-data

# Run
/Users/Shared/portal/start-kiosk-mac.sh
```

## URL Parameters

Override office settings via URL:

```
/client/index.html?local=office-ny&remote=office-serbia
```

## Troubleshooting

**Camera not working**
- Ensure you're using HTTPS (required for camera access)
- Check browser permissions for camera/microphone
- Try a different browser

**Connection stuck on "Calling..."**
- Verify both offices are connected to the signaling server
- Check `/health` endpoint for connected peers
- Ensure firewall allows WebRTC traffic

**Video lag or poor quality**
- WebRTC uses direct peer-to-peer - quality depends on network between offices
- Check network bandwidth and latency

## License

MIT
