export default {
  PEER_SERVER_HOST: 'dy-portal.duckdns.org',      // Oracle VM public IP or domain
  PEER_SERVER_PORT: 443,
  PEER_SERVER_PATH: '/peerjs',
  LOCAL_PEER_ID: 'office-ny',         // e.g. 'office-ny' or 'office-serbia' — set per machine
  REMOTE_PEER_ID: 'office-serbia',        // the other office's peer ID
  RECONNECT_INTERVAL_MS: 10000,
  VIDEO_CONSTRAINTS: {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    frameRate: { ideal: 30 }
  },
  AUDIO_CONSTRAINTS: true
}
