// background.js - Simplified for content script approach
const pendingRedirects = new Map();
const failedRequests = new Map(); // Track failed requests per tab

// Monitor web requests to detect connectivity issues
chrome.webRequest.onErrorOccurred.addListener((details) => {
  // Only monitor main frame requests
  if (details.type !== 'main_frame') return;
  
  // Ignore local and extension URLs
  if (details.url.includes('chrome-extension') || 
      details.url.includes('localhost') ||
      details.url.includes('192.168.1.254')) {
    return;
  }
  
  console.log('[Background] Network error detected for:', details.url, 'Error:', details.error);
  
  // Common network errors that indicate no internet connectivity
  const connectivityErrors = [
    'net::ERR_INTERNET_DISCONNECTED',
    'net::ERR_NETWORK_CHANGED',
    'net::ERR_DNS_RESOLUTION_FAILED',
    'net::ERR_CONNECTION_FAILED',
    'net::ERR_CONNECTION_TIMED_OUT'
  ];
  
  if (connectivityErrors.includes(details.error)) {
    console.log('[Background] Connectivity issue detected, will trigger captive portal check');
    
    // Store the failed URL as original destination
    failedRequests.set(details.tabId, details.url);
    
    // Trigger captive portal detection after a brief delay
    setTimeout(() => {
      triggerCaptivePortalForTab(details.tabId, details.url);
    }, 1000);
  }
}, { urls: ["<all_urls>"] });

// Function to trigger captive portal detection for a specific tab
async function triggerCaptivePortalForTab(tabId, originalUrl) {
  try {
    console.log('[Background] Triggering captive portal for tab:', tabId, 'Original URL:', originalUrl);
    
    // Store the original URL
    pendingRedirects.set(tabId, originalUrl);
    chrome.storage.local.set({ 
      [`originalUrl_${tabId}`]: originalUrl,
      [`originalTime_${tabId}`]: Date.now()
    });
    
    // Navigate to connectivity check URL to trigger captive portal
    await chrome.tabs.update(tabId, { 
      url: 'http://www.gstatic.com/generate_204' 
    });
    
  } catch (error) {
    console.error('[Background] Error triggering captive portal:', error);
  }
}

// Track user navigation intentions - improved logic
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  try {
    if (changeInfo.status === 'loading' && tab.url) {
      const url = new URL(tab.url);
      
      console.log('[Background] Tab updated:', tab.url);
      
      // If user is trying to visit a non-captive portal site, store it
      if (!url.hostname.includes('192.168.1.254') && 
          !url.hostname.includes('chrome-extension') &&
          !url.hostname.includes('localhost') &&
          !url.protocol.includes('chrome') &&
          !url.hostname.includes('newtab') &&
          !url.hostname.includes('gstatic.com')) {
        
        console.log('[Background] User wants to visit:', tab.url);
        pendingRedirects.set(tabId, tab.url);
        
        // Also store in chrome storage immediately
        chrome.storage.local.set({ [`originalUrl_${tabId}`]: tab.url });
      }
      
      // If we end up on captive portal and user wanted to go elsewhere
      if (url.hostname.includes('192.168.1.254') || url.hostname.includes('gstatic.com')) {
        console.log('[Background] Detected captive portal or connectivity check for tab', tabId);
        
        // Check if we have a pending redirect for this tab
        if (pendingRedirects.has(tabId)) {
          const originalUrl = pendingRedirects.get(tabId);
          console.log('[Background] Storing original URL for redirect:', originalUrl);
          chrome.storage.local.set({ [`originalUrl_${tabId}`]: originalUrl });
        } else {
          // If no pending redirect, this is a direct login page visit
          console.log('[Background] Direct login page visit, will auto-close after login');
          chrome.storage.local.set({ [`directLogin_${tabId}`]: true });
        }
      }
    }
  } catch (error) {
    console.error('[Background] Error in tab update listener:', error);
  }
});

// Also listen for navigation events for better coverage
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  try {
    if (details.frameId !== 0) return; // Only main frame
    
    const url = new URL(details.url);
    
    // Store original URLs from navigation events too
    if (!url.hostname.includes('192.168.1.254') && 
        !url.hostname.includes('chrome-extension') &&
        !url.hostname.includes('localhost') &&
        !url.protocol.includes('chrome') &&
        !url.hostname.includes('gstatic.com')) {
      
      console.log('[Background] Navigation to:', details.url);
      pendingRedirects.set(details.tabId, details.url);
      chrome.storage.local.set({ [`originalUrl_${details.tabId}`]: details.url });
    }
  } catch (error) {
    console.error('[Background] Error in navigation listener:', error);
  }
});

// Listen for login success from content script
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === 'storeOriginalUrl' && sender.tab) {
    // Store original URL when connectivity check detects no internet
    const tabId = sender.tab.id;
    console.log('[Background] Storing original URL from connectivity check:', request.url);
    
    pendingRedirects.set(tabId, request.url);
    chrome.storage.local.set({ 
      [`originalUrl_${tabId}`]: request.url,
      [`originalTime_${tabId}`]: Date.now()
    });
    
    sendResponse({ success: true });
    return;
  }
  
  if (request.action === 'loginSuccess' && sender.tab) {
    const tabId = sender.tab.id;
    console.log('[Background] Login successful, checking for redirect and auto-close');
    
    // Get the original URL and direct login flag
    const result = await chrome.storage.local.get([
      `originalUrl_${tabId}`, 
      `directLogin_${tabId}`
    ]);
    const originalUrl = result[`originalUrl_${tabId}`];
    const isDirectLogin = result[`directLogin_${tabId}`];
    
    if (originalUrl && !isDirectLogin) {
      console.log('[Background] User was redirected from:', originalUrl);
      console.log('[Background] Will redirect and close login tab');
      
      // Strategy: Create new tab with original URL, then close the login tab
      setTimeout(async () => {
        try {
          // Check if there are other tabs open
          const allTabs = await chrome.tabs.query({});
          const otherTabs = allTabs.filter(tab => tab.id !== tabId);
          
          if (otherTabs.length > 0) {
            // There are other tabs, safe to close login tab
            console.log('[Background] Creating new tab for:', originalUrl);
            await chrome.tabs.create({ url: originalUrl, active: true });
            
            // Close the login tab after a short delay
            setTimeout(async () => {
              try {
                await chrome.tabs.remove(tabId);
                console.log('[Background] Closed login tab after creating new tab');
              } catch (error) {
                console.error('[Background] Error closing login tab:', error);
              }
            }, 500);
          } else {
            // This is the only tab, redirect it instead of closing
            console.log('[Background] Only tab, redirecting to:', originalUrl);
            await chrome.tabs.update(tabId, { url: originalUrl });
          }
          
          // Clean up storage
          await chrome.storage.local.remove([
            `originalUrl_${tabId}`, 
            `directLogin_${tabId}`
          ]);
          pendingRedirects.delete(tabId);
          
          console.log('[Background] Successfully handled redirect');
        } catch (error) {
          console.error('[Background] Error handling redirect:', error);
        }
      }, 1000);
    } else {
      // No original URL to redirect to, or this was a direct login
      console.log('[Background] Auto-closing login tab (direct login or no original URL)');
      
      setTimeout(async () => {
        try {
          // Check if this is a captive portal tab or connectivity check that should be closed
          const tab = await chrome.tabs.get(tabId);
          if (tab && tab.url && (tab.url.includes('192.168.1.254') || tab.url.includes('gstatic.com'))) {
            // Only close if there are other tabs open
            const allTabs = await chrome.tabs.query({});
            if (allTabs.length > 1) {
              await chrome.tabs.remove(tabId);
              console.log('[Background] Auto-closed direct login tab');
            } else {
              // If it's the only tab, navigate to a useful page instead
              await chrome.tabs.update(tabId, { url: 'https://www.google.com' });
              console.log('[Background] Redirected to Google (only tab)');
            }
          }
          
          // Clean up storage
          await chrome.storage.local.remove([
            `originalUrl_${tabId}`, 
            `directLogin_${tabId}`
          ]);
          pendingRedirects.delete(tabId);
          
        } catch (error) {
          console.error('[Background] Error auto-closing tab:', error);
        }
      }, 1500); // Reduced from 3000ms to 1500ms
    }
  }
});

// Clean up when tabs are closed
chrome.tabs.onRemoved.addListener(async (tabId) => {
  pendingRedirects.delete(tabId);
  failedRequests.delete(tabId);
  await chrome.storage.local.remove([
    `originalUrl_${tabId}`, 
    `directLogin_${tabId}`,
    `originalTime_${tabId}`
  ]);
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Background] Extension installed with auto-redirect and auto-close');
});