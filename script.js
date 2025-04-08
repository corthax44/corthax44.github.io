// [Keep ALL your existing DOM element declarations]
// [Keep ALL your existing helper functions except initConnection() and setupConnection()]

// Enhanced PeerJS configuration
const peer = new Peer({
  debug: 3, // Enable logging (0: disable, 1: errors, 2: warnings, 3: all)
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

// Enhanced connection initialization
function initConnection() {
    isHost = confirm("Are you the host? (Click OK to create room)");
    
    updateConnectionStatus('Connecting...', 'fa-plug', 'connecting');
    
    peer.on('open', (id) => {
        roomIdDisplay.textContent = id;
        
        if (isHost) {
            peer.on('connection', (connection) => {
                conn = connection;
                setupConnection();
                updateConnectionStatus('Connected!', 'fa-link', 'connected');
            });
        } else {
            const hostId = prompt("Enter host's Room ID:");
            if (hostId) {
                connectToHost(hostId);
            } else {
                updateConnectionStatus('Disconnected', 'fa-unlink', 'disconnected');
            }
        }
    });

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

// New function for connecting to host with retry logic
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

// Enhanced connection setup
function setupConnection() {
    conn.on('data', (data) => {
        if (data.type === 'navigate') {
            if (!isHost) {
                loadUrl(data.url);
            }
        }
    });

    conn.on('close', () => {
        updateConnectionStatus('Disconnected', 'fa-unlink', 'disconnected');
    });

    // Add ping-pong for connection health
    setInterval(() => {
        if (conn && conn.open) {
            conn.send({ type: 'ping', timestamp: Date.now() });
        }
    }, 5000);
}

// [Keep ALL your remaining original functions exactly as they were]
