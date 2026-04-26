const express = require('express');
const { ExpressPeerServer } = require('peer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 9000;

const server = app.listen(PORT, () => {
  console.log(`Portal server listening on port ${PORT}`);
});

const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/'
});

app.use('/peerjs', peerServer);

app.use('/client', express.static(path.join(__dirname, '../client')));

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
