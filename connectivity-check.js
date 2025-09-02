// connectivity-check.js - Detects when user tries to access websites without internet
(async () => {
  // Don't run on captive portal pages, extensions, or local pages
  if (window.location.hostname.includes('192.168.1.254') ||
      window.location.hostname.includes('chrome-extension') ||
      window.location.hostname.includes('localhost') ||
      window.location.protocol.includes('chrome') ||
      window.location.hostname.includes('gstatic.com')) {
    return;
  }

  // Don't run if we've already checked recently
  const lastCheck = sessionStorage.getItem('connectivityLastCheck');
  const now = Date.now();
  if (lastCheck && (now - parseInt(lastCheck)) < 30000) { // 30 seconds
    return;
  }

  console.log('[Connectivity] Checking internet connectivity for:', window.location.hostname);

  // Function to test internet connectivity using multiple methods
  async function testConnectivity() {
    const tests = [
      // Test 1: Try to fetch a known connectivity check URL
      async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);

          const response = await fetch('http://www.gstatic.com/generate_204?' + Date.now(), {
            method: 'GET',
            cache: 'no-cache',
            signal: controller.signal,
            mode: 'no-cors'
          });

          clearTimeout(timeoutId);
          return true;
        } catch (error) {
          return false;
        }
      },
      
      // Test 2: Try to create an image request to a reliable server
      async () => {
        return new Promise((resolve) => {
          const img = new Image();
          const timeout = setTimeout(() => {
            img.onload = img.onerror = null;
            resolve(false);
          }, 2000);
          
          img.onload = () => {
            clearTimeout(timeout);
            resolve(true);
          };
          
          img.onerror = () => {
            clearTimeout(timeout);
            resolve(false);
          };
          
          img.src = 'http://www.gstatic.com/generate_204?' + Date.now();
        });
      }
    ];

    // Run tests in parallel and return true if any succeed
    try {
      const results = await Promise.allSettled(tests.map(test => test()));
      return results.some(result => result.status === 'fulfilled' && result.value === true);
    } catch (error) {
      console.log('[Connectivity] All connectivity tests failed:', error);
      return false;
    }
  }

  // Function to check if the page is served from cache
  function isPageFromCache() {
    // Check performance navigation timing
    if ('performance' in window && 'navigation' in performance) {
      const navTiming = performance.getEntriesByType('navigation')[0];
      if (navTiming) {
        // If transfer size is 0, likely from cache
        return navTiming.transferSize === 0 && navTiming.decodedBodySize > 0;
      }
    }
    
    // Check if page loaded very quickly (possible cache indicator)
    if (document.readyState === 'complete') {
      const loadTime = performance.now();
      return loadTime < 100; // Less than 100ms suggests cache
    }
    
    return false;
  }

  // Function to trigger captive portal detection
  async function triggerCaptivePortal() {
    console.log('[Connectivity] Triggering captive portal detection...');
    
    // Store the current URL as the original destination
    try {
      await chrome.runtime.sendMessage({
        action: 'storeOriginalUrl',
        url: window.location.href,
        tabId: 'current'
      });
    } catch (error) {
      console.log('[Connectivity] Failed to store original URL:', error);
    }

    // Navigate to connectivity check URL to trigger captive portal
    console.log('[Connectivity] Navigating to trigger captive portal...');
    window.location.href = 'http://www.gstatic.com/generate_204?' + Date.now();
  }

  // Wait for page to be interactive
  if (document.readyState === 'loading') {
    await new Promise(resolve => {
      document.addEventListener('DOMContentLoaded', resolve, { once: true });
    });
  }

  // Mark that we've done a check
  sessionStorage.setItem('connectivityLastCheck', now.toString());

  // Check if page is from cache and test connectivity
  const fromCache = isPageFromCache();
  const hasInternet = await testConnectivity();

  console.log('[Connectivity] Page from cache:', fromCache, 'Has internet:', hasInternet);

  if (!hasInternet) {
    console.log('[Connectivity] No internet connection detected, triggering captive portal');
    await triggerCaptivePortal();
  } else if (fromCache && window.location.hostname !== 'www.gstatic.com') {
    // Even if we have internet, if this page was from cache, do a quick connectivity verify
    console.log('[Connectivity] Page was from cache, doing additional verification...');
    
    // Wait a bit then do another test
    setTimeout(async () => {
      const secondTest = await testConnectivity();
      if (!secondTest) {
        console.log('[Connectivity] Second test failed, triggering captive portal');
        await triggerCaptivePortal();
      } else {
        console.log('[Connectivity] Second test passed, internet is working');
      }
    }, 2000);
  } else {
    console.log('[Connectivity] Internet connection is working fine');
  }

})().catch(error => {
  console.error('[Connectivity] Error in connectivity check:', error);
});
