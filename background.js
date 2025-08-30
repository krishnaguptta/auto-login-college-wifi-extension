// background.js - Simplified for content script approach
const pendingRedirects = new Map();

// Track user navigation intentions
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && tab.url) {
    const url = new URL(tab.url);
    
    // If user is trying to visit a non-captive portal site, store it
    if (!url.hostname.includes('192.168.1.254') && 
        !url.hostname.includes('chrome-extension') &&
        !url.hostname.includes('localhost') &&
        !url.protocol.includes('chrome')) {
      console.log('[Background] User wants to visit:', tab.url);
      pendingRedirects.set(tabId, tab.url);
    }
    
    // If we end up on captive portal and user wanted to go elsewhere
    if (url.hostname.includes('192.168.1.254') && pendingRedirects.has(tabId)) {
      console.log('[Background] Detected captive portal redirect for tab', tabId);
      // Store original URL for content script
      chrome.storage.local.set({ [`originalUrl_${tabId}`]: pendingRedirects.get(tabId) });
    }
  }
});

// Listen for login success from content script
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === 'loginSuccess' && sender.tab) {
    const tabId = sender.tab.id;
    console.log('[Background] Login successful, checking for redirect');
    
    // Get the original URL
    const result = await chrome.storage.local.get([`originalUrl_${tabId}`]);
    const originalUrl = result[`originalUrl_${tabId}`];
    
    if (originalUrl) {
      console.log('[Background] Redirecting back to:', originalUrl);
      
      // Wait for login to complete, then redirect
      setTimeout(async () => {
        try {
          await chrome.tabs.update(tabId, { url: originalUrl });
          
          // Clean up
          await chrome.storage.local.remove([`originalUrl_${tabId}`]);
          pendingRedirects.delete(tabId);
          
          console.log('[Background] Successfully redirected to original URL');
        } catch (error) {
          console.error('[Background] Error redirecting:', error);
        }
      }, 2000);
    }
  }
});

// Clean up when tabs are closed
chrome.tabs.onRemoved.addListener(async (tabId) => {
  pendingRedirects.delete(tabId);
  await chrome.storage.local.remove([`originalUrl_${tabId}`]);
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Background] Extension installed with auto-redirect');
});