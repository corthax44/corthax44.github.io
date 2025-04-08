// Initialize PeerJS
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
            statusDisplay.textContent = "Partner connected!";
        });
        statusDisplay.textContent = "Waiting for partner...";
    } else {
        const hostId = prompt("Enter host's Room ID:");
        if (hostId) {
            conn = peer.connect(hostId);
            setupConnection();
            statusDisplay.textContent = "Connecting...";
        }
    }
}

// Setup connection handlers
function setupConnection() {
    conn.on('open', () => {
        statusDisplay.textContent = "Connected!";
        
        // Send navigation events
        iframe.addEventListener('load', () => {
            if (isHost) {
                conn.send({
                    type: 'navigate',
                    url: iframe.contentWindow.location.href
                });
            }
        });
    });

    // Receive data
    conn.on('data', (data) => {
        switch(data.type) {
            case 'navigate':
                if (!isHost) {
                    iframe.src = data.url;
                }
                break;
            case 'click':
                // Advanced: Could simulate clicks if needed
                break;
        }
    });
}

// Load URL function
function loadUrl(url) {
    if (!url.startsWith('http')) {
        url = 'https://' + url;
    }
    
    try {
        iframe.src = url;
        statusDisplay.textContent = "Loading...";
        
        if (isHost && conn && conn.open) {
            conn.send({
                type: 'navigate',
                url: url
            });
        }
    } catch (e) {
        statusDisplay.textContent = "Invalid URL";
    }
}

// Go button handler
goBtn.addEventListener('click', () => {
    const url = urlInput.value.trim();
    if (url) {
        loadUrl(url);
    }
});

// Enter key handler
urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        goBtn.click();
    }
});

// Start connection
initConnection();