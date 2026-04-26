import config from './config.js';

const params = new URLSearchParams(window.location.search);
const LOCAL_ID = params.get('local') || config.LOCAL_PEER_ID;
const REMOTE_ID = params.get('remote') || config.REMOTE_PEER_ID;

let peer = null;
let localStream = null;
let currentCall = null;
let isMuted = false;
let isCameraHidden = false;
let currentFacingMode = 'user';
let availableCameras = [];
let localVideoRotation = 0;

// Show office selection or portal based on URL params
document.addEventListener('DOMContentLoaded', () => {
  if (LOCAL_ID && REMOTE_ID) {
    document.getElementById('office-select').classList.add('hidden');
    document.getElementById('portal').classList.remove('hidden');
    init();
  }
});

async function init() {
  updateStatus('Initializing...');
  await enumerateCameras();
  try {
    await getLocalStream();
    connectToPeerServer();
  } catch (err) {
    handleCameraError(err);
  }
}

async function enumerateCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    availableCameras = devices.filter(d => d.kind === 'videoinput');
    console.log('Available cameras:', availableCameras.length);
  } catch (err) {
    console.error('Could not enumerate devices:', err);
  }
}

async function getLocalStream(facingMode = 'user') {
  updateStatus('Requesting camera/microphone access...');

  const constraints = {
    video: {
      ...config.VIDEO_CONSTRAINTS,
      facingMode: facingMode
    },
    audio: config.AUDIO_CONSTRAINTS
  };

  try {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }

    localStream = await navigator.mediaDevices.getUserMedia(constraints);

    const localVideo = document.getElementById('local-video');
    localVideo.srcObject = localStream;
    localVideo.muted = true;
    await localVideo.play();

    if (isMuted) {
      localStream.getAudioTracks().forEach(track => track.enabled = false);
    }
    if (isCameraHidden) {
      localStream.getVideoTracks().forEach(track => track.enabled = false);
    }

    document.getElementById('camera-error').classList.add('hidden');
    updateStatus('Local stream ready');
    currentFacingMode = facingMode;

    return localStream;
  } catch (err) {
    console.error('getUserMedia error:', err);
    throw err;
  }
}

function handleCameraError(err) {
  console.error('Camera error:', err);
  const errorEl = document.getElementById('camera-error');
  const messageEl = document.getElementById('error-message');

  let message = 'Unable to access camera or microphone.';

  if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
    message = 'Camera/microphone access was denied. Please allow access in your browser settings and try again.';
  } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
    message = 'No camera or microphone found. Please connect a device and try again.';
  } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
    message = 'Camera is in use by another application. Please close other apps using the camera.';
  } else if (err.name === 'OverconstrainedError') {
    message = 'Camera does not support the requested settings. Trying with default settings...';
  } else if (err.name === 'TypeError') {
    message = 'No camera constraints specified.';
  }

  messageEl.textContent = message;
  errorEl.classList.remove('hidden');
  updateStatus('Camera error');
}

window.retryCamera = async function() {
  document.getElementById('camera-error').classList.add('hidden');
  try {
    await getLocalStream();
    connectToPeerServer();
  } catch (err) {
    handleCameraError(err);
  }
};

window.continueWithoutCamera = function() {
  document.getElementById('camera-error').classList.add('hidden');
  localStream = null;
  connectToPeerServer();
  updateStatus('Connected without camera');
};

function connectToPeerServer() {
  updateStatus('Connecting to signaling server...');

  peer = new Peer(LOCAL_ID, {
    host: config.PEER_SERVER_HOST,
    port: config.PEER_SERVER_PORT,
    path: config.PEER_SERVER_PATH,
    secure: config.PEER_SERVER_HOST !== 'localhost'
  });

  peer.on('open', (id) => {
    console.log('Connected to peer server with ID:', id);
    updateStatus(`Connected as ${id}, calling remote...`);
    callRemote();
  });

  peer.on('call', (call) => {
    console.log('Incoming call from:', call.peer);
    updateStatus(`Incoming call from ${call.peer}`);
    call.answer(localStream);

    call.on('stream', (stream) => {
      handleRemoteStream(stream);
    });

    call.on('close', () => {
      updateStatus('Call closed, reconnecting...');
      scheduleReconnect();
    });

    call.on('error', (err) => {
      console.error('Call error:', err);
      updateStatus(`Call error: ${err.message}`);
      scheduleReconnect();
    });

    currentCall = call;
  });

  peer.on('disconnected', () => {
    console.log('Disconnected from peer server, attempting reconnect...');
    updateStatus('Disconnected, reconnecting...');
    peer.reconnect();
  });

  peer.on('error', (err) => {
    console.error('Peer error:', err);
    updateStatus(`Error: ${err.type}`);
    scheduleReconnect();
  });

  peer.on('close', () => {
    console.log('Peer connection closed');
    updateStatus('Connection closed');
    scheduleReconnect();
  });
}

function callRemote() {
  if (!peer || !REMOTE_ID) {
    console.log('Cannot call remote: missing peer or remote ID');
    return;
  }

  updateStatus(`Calling ${REMOTE_ID}...`);

  const call = peer.call(REMOTE_ID, localStream);

  if (!call) {
    console.log('Call failed to initiate');
    scheduleReconnect();
    return;
  }

  call.on('stream', (stream) => {
    handleRemoteStream(stream);
  });

  call.on('close', () => {
    updateStatus('Call ended, reconnecting...');
    scheduleReconnect();
  });

  call.on('error', (err) => {
    console.error('Outgoing call error:', err);
    updateStatus(`Call error: ${err.message}`);
    scheduleReconnect();
  });

  currentCall = call;
}

function handleRemoteStream(stream) {
  console.log('Received remote stream');
  const remoteVideo = document.getElementById('remote-video');
  remoteVideo.srcObject = stream;
  remoteVideo.autoplay = true;
  remoteVideo.playsInline = true;
  remoteVideo.muted = false;
  remoteVideo.play().catch(err => {
    console.error('Error playing remote video:', err);
  });

  updateStatus('Connected');
}

let reconnectTimeout = null;

function scheduleReconnect() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }

  updateStatus('Reconnecting...');

  reconnectTimeout = setTimeout(() => {
    reconnect();
  }, config.RECONNECT_INTERVAL_MS);
}

function reconnect() {
  if (peer && peer.destroyed) {
    console.log('Peer destroyed, creating new connection...');
    connectToPeerServer();
  } else if (peer && !peer.disconnected) {
    console.log('Peer still connected, attempting call...');
    callRemote();
  } else if (peer) {
    console.log('Attempting peer reconnect...');
    peer.reconnect();
  } else {
    console.log('No peer, creating new connection...');
    connectToPeerServer();
  }
}

function updateStatus(message) {
  const timestamp = new Date().toLocaleTimeString();
  const statusEl = document.getElementById('status');
  if (statusEl) {
    statusEl.textContent = `[${timestamp}] ${message}`;
  }
  console.log(`Status: ${message}`);
}

// Control functions
window.toggleMute = function() {
  if (!localStream) return;

  isMuted = !isMuted;
  localStream.getAudioTracks().forEach(track => {
    track.enabled = !isMuted;
  });

  const btn = document.getElementById('btn-mute');
  const icon = document.getElementById('mute-icon');
  btn.classList.toggle('active', isMuted);
  icon.textContent = isMuted ? '🔇' : '🔊';
};

window.toggleCamera = function() {
  if (!localStream) return;

  isCameraHidden = !isCameraHidden;
  localStream.getVideoTracks().forEach(track => {
    track.enabled = !isCameraHidden;
  });

  const btn = document.getElementById('btn-camera');
  const icon = document.getElementById('camera-icon');
  const localVideo = document.getElementById('local-video');

  btn.classList.toggle('active', isCameraHidden);
  icon.textContent = isCameraHidden ? '📷' : '📷';
  localVideo.classList.toggle('hidden-camera', isCameraHidden);
};

window.rotateCamera = function() {
  localVideoRotation = (localVideoRotation + 90) % 360;
  const localVideo = document.getElementById('local-video');
  localVideo.style.transform = `rotate(${localVideoRotation}deg)`;

  // Adjust size for portrait mode
  if (localVideoRotation === 90 || localVideoRotation === 270) {
    localVideo.style.aspectRatio = '9/16';
  } else {
    localVideo.style.aspectRatio = '16/9';
  }
};

window.toggleFullscreen = function() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.error('Fullscreen error:', err);
    });
  } else {
    document.exitFullscreen();
  }
};

document.addEventListener('fullscreenchange', () => {
  const icon = document.getElementById('fullscreen-icon');
  if (icon) {
    icon.textContent = document.fullscreenElement ? '⛶' : '⛶';
  }
});

window.goBack = function() {
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }
  if (peer) {
    peer.destroy();
  }
  window.location.href = window.location.pathname;
};
