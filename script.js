// DOM Elements (keep all your existing references)
const iframe = document.getElementById('shared-browser');
const urlInput = document.getElementById('url-input');
// ... [all other existing DOM element references] ...

// Initialize PeerJS with better configuration
const peer = new Peer({
  debug: 3, // Helpful logging
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ]
  }
});

let conn;
let isHost = false;
let currentUrl = '';
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;

// Generate more reliable room IDs
function generateRoomId() {
  return `${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 4)}`;
}

// Initialize connection with retry logic
function initConnection() {
  isHost = confirm("Are you the host? (Click OK to create room)");
  
  updateConnectionStatus('Connecting...', 'fa-plug', 'connecting');
  
  if (isHost) {
    peer.on('connection', (connection) => {
      conn = connection;
      setupConnection();
      updateConnectionStatus('Connected!', 'fa-link', 'connected');
    });
    
    peer.on('disconnected', () => {
      updateConnectionStatus('Reconnecting...', 'fa-sync-alt', 'connecting');
      peer.reconnect();
    });
  } else {
    const hostId = prompt("Enter host's Room ID:");
    if (hostId) {
      connectToHost(hostId);
    } else {
      updateConnectionStatus('Disconnected', 'fa-unlink', 'disconnected');
    }
  }

  peer.on('error', (err) => {
    console.error("PeerJS error:", err);
    if (err.type === 'unavailable-id' && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      setTimeout(() => initConnection(), 1000 * reconnectAttempts);
    } else {
      updateConnectionStatus('Connection failed', 'fa-exclamation-triangle', 'error');
    }
  });
}

// Improved host connection function
function connectToHost(hostId) {
  conn = peer.connect(hostId, {
    reliable: true,
    serialization: 'json'
  });
  
  conn.on('open', () => {
    reconnectAttempts = 0;
    setupConnection();
    updateConnectionStatus('Connected!', 'fa-link', 'connected');
  });
  
  conn.on('close', () => {
    updateConnectionStatus('Disconnected', 'fa-unlink', 'disconnected');
  });
  
  conn.on('error', (err) => {
    console.error("Connection error:", err);
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      setTimeout(() => connectToHost(hostId), 1000 * reconnectAttempts);
    } else {
      updateConnectionStatus('Connection failed', 'fa-exclamation-triangle', 'error');
    }
  });
}

// [Keep all your other existing functions like loadUrl(), toggleTheme(), etc.]
// Only replace the connection-related functions shown above

// Initialize with default page
peer.on('open', () => {
  roomIdDisplay.textContent = peer.id;
  loadUrl('https://example.com');
});
