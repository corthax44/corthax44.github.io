// DOM Elements
const iframe = document.getElementById('shared-browser');
const urlInput = document.getElementById('url-input');
const goBtn = document.getElementById('go-btn');
const backBtn = document.getElementById('back-btn');
const forwardBtn = document.getElementById('forward-btn');
const refreshBtn = document.getElementById('refresh-btn');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const roomIdDisplay = document.getElementById('room-id');
const copyRoomIdBtn = document.getElementById('copy-room-id');
const statusText = document.getElementById('status-text');
const connectionIcon = document.getElementById('connection-icon');
const themeSwitch = document.getElementById('theme-switch');
const favoriteBtns = document.querySelectorAll('.favorite-btn');
const addFavoriteBtn = document.getElementById('add-favorite-btn');
const addFavoriteModal = document.getElementById('add-favorite-modal');
const cancelFavoriteBtn = document.getElementById('cancel-favorite');
const saveFavoriteBtn = document.getElementById('save-favorite');
const favoriteUrlInput = document.getElementById('favorite-url');
const favoriteNameInput = document.getElementById('favorite-name');

// Initialize PeerJS
const peer = new Peer();
let conn;
let isHost = false;
let currentUrl = '';

// Proxy configuration (updated list)
const PROXY_SERVERS = [
    'https://api.allorigins.win/raw?url=',      // Most reliable
    'https://thingproxy.freeboard.io/fetch/',   // Good fallback
    'https://corsproxy.io/?',                   // No auth needed
    'https://yacdn.org/proxy/'                  // Last resort
];

// Sites that will never work in iframes
const BLOCKED_SITES = [
    'youtube.com',
    'netflix.com',
    'twitter.com',
    'instagram.com',
    'facebook.com',
    'accounts.google.com',
    'bankofamerica.com'
];

// Generate room ID
const roomId = generateRoomId();
roomIdDisplay.textContent = roomId;

// Theme switcher
themeSwitch.addEventListener('change', toggleTheme);

// Check for saved theme preference
if (localStorage.getItem('darkMode') === 'true') {
    themeSwitch.checked = true;
    document.body.classList.add('dark-mode');
}

// Initialize connection
initConnection();

// Navigation controls
goBtn.addEventListener('click', loadCurrentUrl);
urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') loadCurrentUrl();
});

backBtn.addEventListener('click', () => {
    try {
        iframe.contentWindow.history.back();
    } catch (e) {
        console.error("Cannot go back:", e);
    }
});

forwardBtn.addEventListener('click', () => {
    try {
        iframe.contentWindow.history.forward();
    } catch (e) {
        console.error("Cannot go forward:", e);
    }
});

refreshBtn.addEventListener('click', () => {
    iframe.src = iframe.src;
});

fullscreenBtn.addEventListener('click', toggleFullscreen);

// Copy Room ID
copyRoomIdBtn.addEventListener('click', copyRoomId);

// Favorites
addFavoriteBtn.addEventListener('click', showAddFavoriteModal);
cancelFavoriteBtn.addEventListener('click', hideAddFavoriteModal);
saveFavoriteBtn.addEventListener('click', saveFavorite);

// Add event listeners to existing favorite buttons
favoriteBtns.forEach(btn => {
    if (btn.id !== 'add-favorite-btn') {
        btn.addEventListener('click', () => {
            const url = btn.getAttribute('data-url');
            urlInput.value = url;
            loadUrl(url);
        });
    }
});

// ====================================
// IMPROVED URL LOADER WITH PROXY SUPPORT
// ====================================

function loadUrl(url) {
    if (!url) return;
    
    // Auto-add https:// if missing
    if (!url.startsWith('http')) {
        url = 'https://' + url;
    }
    
    currentUrl = url;
    urlInput.value = url;
    
    // Check for blocked sites
    if (BLOCKED_SITES.some(site => url.includes(site))) {
        updateConnectionStatus('Site blocks embedding', 'fa-ban', 'error');
        return;
    }

    let proxyIndex = 0;
    
    const tryProxy = () => {
        if (proxyIndex >= PROXY_SERVERS.length) {
            updateConnectionStatus('All proxies failed', 'fa-exclamation-triangle', 'error');
            return;
        }

        const proxyUrl = PROXY_SERVERS[proxyIndex] + encodeURIComponent(url);
        iframe.src = proxyUrl;
        updateConnectionStatus(`Loading via ${getProxyName(proxyIndex)}...`, 'fa-spinner fa-spin', 'connecting');

        iframe.onload = iframe.onerror = () => {
            try {
                // Check if page actually loaded
                if (iframe.contentDocument && iframe.contentDocument.URL !== 'about:blank') {
                    // Success!
                    updateConnectionStatus('Connected!', 'fa-link', 'connected');
                    if (isHost && conn && conn.open) {
                        conn.send({ type: 'navigate', url: url });
                    }
                } else {
                    // Try next proxy
                    proxyFail();
                }
            } catch (e) {
                proxyFail();
            }
        };

        function proxyFail() {
            proxyIndex++;
            setTimeout(tryProxy, 500); // Add slight delay between attempts
        }
    };

    tryProxy();
}

function getProxyName(index) {
    const names = ['AllOrigins', 'ThingProxy', 'CorsProxy', 'Yacdn'];
    return names[index] || `Proxy ${index + 1}`;
}

// ====================================
// ALL YOUR ORIGINAL FUNCTIONS BELOW
// (Identical to your previous version)
// ====================================

function generateRoomId() {
    return Math.random().toString(36).substring(2, 6);
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', themeSwitch.checked);
}

function initConnection() {
    isHost = confirm("Are you the host? (Click OK to create room)");
    
    updateConnectionStatus('Connecting...', 'fa-plug', 'connecting');
    
    if (isHost) {
        peer.on('connection', (connection) => {
            conn = connection;
            setupConnection();
            updateConnectionStatus('Connected!', 'fa-link', 'connected');
        });
    } else {
        const hostId = prompt("Enter host's Room ID:");
        if (hostId) {
            conn = peer.connect(hostId);
            setupConnection();
        } else {
            updateConnectionStatus('Disconnected', 'fa-unlink', 'disconnected');
        }
    }

    peer.on('error', (err) => {
        console.error("PeerJS error:", err);
        updateConnectionStatus('Error: ' + err.type, 'fa-exclamation-triangle', 'error');
    });
}

function setupConnection() {
    conn.on('open', () => {
        updateConnectionStatus('Connected!', 'fa-link', 'connected');
        
        // Sync URL changes
        iframe.addEventListener('load', () => {
            try {
                const iframeUrl = iframe.contentWindow.location.href;
                if (isHost && conn.open) {
                    conn.send({ type: 'navigate', url: iframeUrl });
                }
            } catch (e) {
                // Cross-origin error, can't access iframe URL
            }
        });
    });

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

    conn.on('error', (err) => {
        console.error("Connection error:", err);
        updateConnectionStatus('Error', 'fa-exclamation-triangle', 'error');
    });
}

function updateConnectionStatus(text, icon, status) {
    statusText.textContent = text;
    connectionIcon.className = 'fas ' + icon;
    connectionIcon.parentElement.className = 'connection-status ' + status;
}

function loadCurrentUrl() {
    const url = urlInput.value.trim();
    loadUrl(url);
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        iframe.requestFullscreen().catch(err => {
            console.error("Fullscreen error:", err);
        });
    } else {
        document.exitFullscreen();
    }
}

function copyRoomId() {
    navigator.clipboard.writeText(roomId).then(() => {
        const originalText = copyRoomIdBtn.innerHTML;
        copyRoomIdBtn.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
            copyRoomIdBtn.innerHTML = originalText;
        }, 2000);
    });
}

function showAddFavoriteModal() {
    favoriteUrlInput.value = currentUrl || '';
    favoriteNameInput.value = '';
    addFavoriteModal.style.display = 'flex';
}

function hideAddFavoriteModal() {
    addFavoriteModal.style.display = 'none';
}

function saveFavorite() {
    const url = favoriteUrlInput.value.trim();
    const name = favoriteNameInput.value.trim();
    
    if (!url) {
        alert("Please enter a URL");
        return;
    }
    
    // Create new favorite button
    const newBtn = document.createElement('button');
    newBtn.className = 'favorite-btn';
    newBtn.setAttribute('data-url', url);
    newBtn.setAttribute('title', name || url);
    
    // Try to get icon based on domain
    const domain = new URL(url).hostname.replace('www.', '');
    const icon = getDomainIcon(domain);
    
    if (icon) {
        newBtn.innerHTML = `<i class="${icon}"></i>`;
    } else {
        newBtn.innerHTML = `<i class="fas fa-globe"></i>`;
    }
    
    newBtn.addEventListener('click', () => {
        urlInput.value = url;
        loadUrl(url);
    });
    
    // Insert before the add button
    addFavoriteBtn.parentNode.insertBefore(newBtn, addFavoriteBtn);
    hideAddFavoriteModal();
}

function getDomainIcon(domain) {
    const iconMap = {
        'youtube.com': 'fab fa-youtube',
        'netflix.com': 'fab fa-netflix',
        'twitter.com': 'fab fa-twitter',
        'facebook.com': 'fab fa-facebook',
        'instagram.com': 'fab fa-instagram',
        'reddit.com': 'fab fa-reddit',
        'wikipedia.org': 'fab fa-wikipedia-w',
        'github.com': 'fab fa-github',
        'google.com': 'fab fa-google'
    };
    
    return iconMap[domain] || null;
}

// Initialize with a default page
loadUrl('https://example.com');
