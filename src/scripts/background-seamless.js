// FIXED Background Service Worker - Proper Tab Management
console.log('[Background] 🚀 FIXED service worker loaded - proper login tab management');

// FIXED: Simplified state management
let lastLoginAttempt = 0;
let backgroundLoginTabs = new Map();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Background] Message received:', request.action, 'from tab:', sender.tab?.id);

  // Handle background login requests
  if (request.action === 'backgroundLogin') {
    handleBackgroundLogin(request, sender, sendResponse);
    return true;
  }

  // Handle login success notification
  if (request.action === 'loginSuccess') {
    console.log('[Background] 🎉 Login success reported from tab:', sender.tab?.id);
    
    // Track successful login
    lastLoginAttempt = Date.now();
    
    // ENHANCED: Close background login tab immediately
    if (sender.tab?.id && backgroundLoginTabs.has(sender.tab.id)) {
      console.log('[Background] 🚪 SUCCESS! Closing background login tab immediately:', sender.tab.id);
      
      // Update tab status
      const tabInfo = backgroundLoginTabs.get(sender.tab.id);
      tabInfo.status = 'success';
      backgroundLoginTabs.set(sender.tab.id, tabInfo);
      
      // Close the tab immediately for seamless experience
      chrome.tabs.remove(sender.tab.id).then(() => {
        console.log('[Background] ✅ Background login tab closed successfully');
        backgroundLoginTabs.delete(sender.tab.id);
      }).catch(error => {
        console.log('[Background] ⚠️ Tab close error (may already be closed):', error.message);
        backgroundLoginTabs.delete(sender.tab.id);
      });
    }
    
    sendResponse({ 
      success: true, 
      message: 'Login success acknowledged - tab closed immediately for seamless experience'
    });
    
    return true;
  }

  // Handle debug/status requests
  if (request.action === 'getStatus') {
    sendResponse({
      success: true,
      lastLoginAttempt: lastLoginAttempt,
      backgroundLoginTabs: backgroundLoginTabs.size,
      method: 'enhanced-background-v2.1',
      isActive: true,
      startTime: Date.now()
    });
    
    return true;
  }

  return false;
});

// FIXED: Background login handler with proper tab management
async function handleBackgroundLogin(request, sender, sendResponse) {
  try {
    console.log('[Background] 🔄 Handling background login request from:', sender.tab?.url);
    
    // FIXED: Prevent too frequent login attempts (5 second cooldown - reduced for speed)
    const now = Date.now();
    if (now - lastLoginAttempt < 5000) {
      console.log('[Background] ⏳ Login cooldown active, skipping');
      sendResponse({ 
        success: false, 
        message: 'Login cooldown active',
        cooldownRemaining: Math.ceil((5000 - (now - lastLoginAttempt)) / 1000)
      });
      return;
    }
    
    lastLoginAttempt = now;
    
    // Check if we have credentials
    const settings = await chrome.storage.local.get({ username: '', password: '' });
    
    if (!settings.username || !settings.password) {
      console.log('[Background] ❌ No credentials available');
      sendResponse({ 
        success: false, 
        message: 'No credentials configured' 
      });
      return;
    }
    
    console.log('[Background] ⚡ Creating INSTANT background login tab...');
    
    // ENHANCED: Create a background tab for INSTANT seamless login
    const loginTab = await chrome.tabs.create({
      url: 'http://192.168.1.254:8090/',
      active: false, // Don't focus the tab - keep it hidden
      pinned: false
    });
    
    console.log('[Background] ⚡ INSTANT background login tab created:', loginTab.id);
    
    // Track this tab for cleanup
    backgroundLoginTabs.set(loginTab.id, {
      originalTab: sender.tab?.id,
      created: now,
      purpose: 'instant-seamless-login',
      status: 'created',
      priority: request.priority || 'normal'
    });
    
    // ENHANCED: Auto-close timer - force close after 30 seconds (reduced for speed)
    setTimeout(() => {
      if (backgroundLoginTabs.has(loginTab.id)) {
        console.log('[Background] ⏰ Force closing stale login tab:', loginTab.id);
        chrome.tabs.remove(loginTab.id).then(() => {
          backgroundLoginTabs.delete(loginTab.id);
          console.log('[Background] 🧹 Stale tab cleaned up');
        }).catch(() => {
          backgroundLoginTabs.delete(loginTab.id);
        });
      }
    }, 30000); // Reduced from 45 seconds to 30 seconds
    
    sendResponse({ 
      success: true, 
      method: 'background-tab',
      loginTabId: loginTab.id,
      message: 'Background login tab created'
    });
    
  } catch (error) {
    console.error('[Background] Error in background login:', error);
    sendResponse({ 
      success: false, 
      error: error.message,
      message: 'Background login failed'
    });
  }
}

// FIXED: Monitor tab events for cleanup
chrome.tabs.onRemoved.addListener((tabId) => {
  if (backgroundLoginTabs.has(tabId)) {
    console.log('[Background] 🧹 Cleaning up removed background login tab:', tabId);
    backgroundLoginTabs.delete(tabId);
  }
});

// FIXED: Periodic cleanup of stale login tabs
setInterval(() => {
  const now = Date.now();
  const staleTime = 60000; // 1 minute
  
  for (const [tabId, info] of backgroundLoginTabs.entries()) {
    if (now - info.created > staleTime) {
      console.log('[Background] 🧹 Removing stale background login tab:', tabId);
      chrome.tabs.remove(tabId).then(() => {
        backgroundLoginTabs.delete(tabId);
      }).catch(() => {
        backgroundLoginTabs.delete(tabId);
      });
    }
  }
}, 30000); // Check every 30 seconds

// FIXED: Startup handling
chrome.runtime.onStartup.addListener(() => {
  console.log('[Background] 🚀 Extension startup - background login ready');
  backgroundLoginTabs.clear(); // Clear any stale tab references
});

console.log('[Background] ✅ FIXED background service ready - proper tab management enabled');
