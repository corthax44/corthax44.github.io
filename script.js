// DOM Elements (keep all your existing elements)
const iframe = document.getElementById('shared-browser');
// ... [keep all your other DOM element declarations] ...

// Initialize PeerJS
const peer = new Peer();
let conn;
let isHost = false;
let currentUrl = '';

// NEW: More reliable proxy list (updated 2023)
const PROXY_SERVERS = [
    'https://api.codetabs.com/v1/proxy/?quest=',  // Most reliable
    'https://corsproxy.io/?',                     # No auth needed
    'https://proxy.cors.sh/?',                    # Alternative
    ''                                            # Direct (no proxy) as last resort
];

// Sites that will never work in iframes
const BLOCKED_SITES = [
    'youtube.com',
    'netflix.com',
    'twitter.com',
    'instagram.com',
    'facebook.com',
    'disneyplus.com',
    'primevideo.com'
];

// Generate room ID
const roomId = generateRoomId();
roomIdDisplay.textContent = roomId;

// [Keep all your existing event listeners and helper functions]

// ====================================
// NEW IMPROVED LOADURL() FUNCTION
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
        updateConnectionStatus('This site blocks embedding', 'fa-ban', 'error');
        return;
    }

    let proxyIndex = 0;
    
    const tryProxy = () => {
        if (proxyIndex >= PROXY_SERVERS.length) {
            updateConnectionStatus('Failed to load', 'fa-exclamation-triangle', 'error');
            return;
        }

        // NEW: Handle direct connection (no proxy) case
        const proxyUrl = PROXY_SERVERS[proxyIndex] 
            ? PROXY_SERVERS[proxyIndex] + encodeURIComponent(url)
            : url;

        iframe.src = proxyUrl;
        updateConnectionStatus(`Loading...`, 'fa-spinner fa-spin', 'connecting');

        // NEW: Better error handling
        const cleanup = () => {
            iframe.onload = null;
            iframe.onerror = null;
        };

        iframe.onload = iframe.onerror = () => {
            cleanup();
            
            // Check if loaded successfully
            try {
                if (iframe.contentDocument && iframe.contentDocument.URL !== 'about:blank' && 
                    !iframe.contentDocument.body.innerText.includes('failed')) {
                    // Success!
                    updateConnectionStatus('Connected!', 'fa-link', 'connected');
                    if (isHost && conn && conn.open) {
                        conn.send({ type: 'navigate', url: url });
                    }
                } else {
                    // Try next proxy
                    proxyIndex++;
                    setTimeout(tryProxy, 300); // Small delay between attempts
                }
            } catch (e) {
                proxyIndex++;
                setTimeout(tryProxy, 300);
            }
        };
    };

    tryProxy();
}

// [Keep all your remaining original functions]
