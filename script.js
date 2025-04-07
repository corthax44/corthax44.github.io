// Initialize PeerJS (free P2P connection)
const peer = new Peer();

// Get the video element
const video = document.getElementById('shared-video');

// When the page loads, generate a random room ID
let roomId = Math.random().toString(36).substring(2, 8);
alert(`Share this Room ID: ${roomId}`);

// Connect to the other person
let conn;
if (confirm("Are you the host? (Click OK if you're starting the stream)")) {
    // Host waits for a connection
    peer.on('connection', (connection) => {
        conn = connection;
        setupConnection();
    });
} else {
    // Viewer enters the host's Room ID
    const hostId = prompt("Enter the Host's Room ID:");
    conn = peer.connect(hostId);
    setupConnection();
}

// Sync video controls
function setupConnection() {
    conn.on('open', () => {
        // Send play/pause events
        video.addEventListener('play', () => {
            conn.send({ type: 'play', time: video.currentTime });
        });
        video.addEventListener('pause', () => {
            conn.send({ type: 'pause', time: video.currentTime });
        });
    });

    // Receive play/pause events
    conn.on('data', (data) => {
        if (data.type === 'play') {
            video.currentTime = data.time;
            video.play();
        } else if (data.type === 'pause') {
            video.currentTime = data.time;
            video.pause();
        }
    });
}