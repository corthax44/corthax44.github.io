const peer = new Peer();
const iframe = document.getElementById('shared-browser');
const urlInput = document.getElementById('url-input');
const goBtn = document.getElementById('go-btn');
const roomIdDisplay = document.getElementById('room-id');
const statusDisplay = document.getElementById('status');

// Generate room ID
const roomId = Math.random().toString(36).substring(2, 6);
roomIdDisplay.textContent = roomId;

let conn;
let isHost = false;

// Initialize connection
function initConnection() {
  isHost = confirm("Are you the host? (Click OK to create room)");
  
  if (isHost) {
    peer.on('connection', (connection) => {
      conn = connection;
      setupConnection();
      statusDisplay.textContent = "✅ Partner connected!";
      console.log("Partner connected:", conn.peer);
    });
    statusDisplay.textContent = "⌛ Waiting for partner...";
  } else {
    const hostId = prompt("Enter host's Room ID:");
    if (hostId) {
      conn = peer.connect(hostId);
      setupConnection();
      statusDisplay.textContent = "🔗 Connecting...";
    }
  }

  // Debug PeerJS errors
  peer.on('error', (err) => {
    console.error("PeerJS error:", err);
    statusDisplay.textContent = "❌ Connection failed";
  });
}

// Setup connection handlers
function setupConnection() {
  conn.on('open', () => {
    statusDisplay.textContent = "✅ Connected!";
    console.log("Connection open!");
  });

  conn.on('data', (data) => {
    console.log("Received data:", data);
    if (data.type === 'navigate') {
      iframe.src = data.url;
    }
  });

  conn.on('close', () => {
    statusDisplay.textContent = "❌ Disconnected";
  });
}

// Load URL function
function loadUrl(url) {
  if (!url) return;
  
  // Auto-add https:// if missing
  if (!url.startsWith('http')) {
    url = 'https://' + url;
  }

  console.log("Loading URL:", url);
  iframe.src = url;
  statusDisplay.textContent = "🌐 Loading...";

  if (isHost && conn && conn.open) {
    conn.send({ type: 'navigate', url: url });
  }
}

// Event listeners
goBtn.addEventListener('click', () => {
  const url = urlInput.value.trim();
  loadUrl(url);
});

urlInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    loadUrl(urlInput.value.trim());
  }
});

// Start connection
initConnection();