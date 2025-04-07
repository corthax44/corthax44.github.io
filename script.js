// Initialize PeerJS connection
const peer = new Peer();
const video = document.getElementById('shared-video');
let conn;

// Generate a simple room ID
const roomId = Math.random().toString(36).substring(2, 6);
document.getElementById('room-id').textContent = `Room ID: ${roomId}`;

// Fullscreen button
document.getElementById('fullscreen').addEventListener('click', () => {
    if (video.requestFullscreen) {
        video.requestFullscreen();
    }
});

// Host (first person to load)
if (confirm("Are you starting the stream? (Click OK if you're the host)")) {
    peer.on('connection', (connection) => {
        conn = connection;
        setupConnection();
    });
} 
// Viewer (second person)
else {
    const hostId = prompt("Enter the Host's Room ID:");
    conn = peer.connect(hostId);
    setupConnection();
}

function setupConnection() {
    conn.on('open', () => {
        // Sync play/pause
        video.addEventListener('play', () => {
            conn.send({ type: 'play', time: video.currentTime });
        });
        
        video.addEventListener('pause', () => {
            conn.send({ type: 'pause', time: video.currentTime });
        });
    });

    // Receive sync commands
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