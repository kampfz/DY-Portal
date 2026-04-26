const express = require('express');
const { ExpressPeerServer } = require('peer');
const path = require('path');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 9000;
const PASSWORD = process.env.PORTAL_PASSWORD || 'portal123';
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

const sessions = new Set();

app.use(express.json());
app.use(cookieParser());

const server = app.listen(PORT, () => {
  console.log(`Portal server listening on port ${PORT}`);
});

const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/'
});

app.use('/peerjs', peerServer);

function requireAuth(req, res, next) {
  const sessionId = req.cookies.session;
  if (sessionId && sessions.has(sessionId)) {
    return next();
  }
  res.redirect('/login');
}

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/login.html'));
});

app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === PASSWORD) {
    const sessionId = crypto.randomBytes(32).toString('hex');
    sessions.add(sessionId);
    res.cookie('session', sessionId, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: 'Invalid password' });
  }
});

app.post('/api/logout', (req, res) => {
  const sessionId = req.cookies.session;
  if (sessionId) sessions.delete(sessionId);
  res.clearCookie('session');
  res.json({ success: true });
});

app.use('/client', requireAuth, express.static(path.join(__dirname, '../client')));

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>Portal Server Dashboard</title></head>
      <body style="font-family: sans-serif; padding: 20px;">
        <h1>Portal Server Dashboard</h1>
        <p>Server is running on port ${PORT}</p>
        <p>PeerJS endpoint: <code>/peerjs</code></p>
        <p>Client: <a href="/client/index.html">/client/index.html</a></p>
        <p>Health check: <a href="/health">/health</a></p>
        <h2>Connected Peers</h2>
        <pre id="peers">Loading...</pre>
        <script>
          setInterval(() => {
            fetch('/health').then(r => r.json()).then(data => {
              document.getElementById('peers').textContent = JSON.stringify(data, null, 2);
            });
          }, 2000);
        </script>
      </body>
    </html>
  `);
});

let connectedPeers = new Set();

peerServer.on('connection', (client) => {
  connectedPeers.add(client.getId());
  console.log(`Peer connected: ${client.getId()} (total: ${connectedPeers.size})`);
});

peerServer.on('disconnect', (client) => {
  connectedPeers.delete(client.getId());
  console.log(`Peer disconnected: ${client.getId()} (total: ${connectedPeers.size})`);
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    peers: connectedPeers.size,
    peerIds: Array.from(connectedPeers)
  });
});
