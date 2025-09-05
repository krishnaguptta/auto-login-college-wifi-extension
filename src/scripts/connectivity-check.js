// RESTORED WiFi Monitor - Proper WiFi Disconnection Detection + HTTPS Safe
// Version 2.2.0 - FUNCTIONAL WiFi Detection Restored
console.log('[WiFi-Monitor] 🚀 FUNCTIONAL monitor v2.2.0 loaded on:', window.location.href);

(function() {
  'use strict';
  
  // Don't run on captive portal pages or extension pages
  if (window.location.hostname.includes('192.168.1.254') ||
      window.location.hostname.includes('chrome-extension') ||
      window.location.protocol.includes('chrome')) {
    console.log('[WiFi-Monitor] Skipping monitoring on:', window.location.hostname);
    return;
  }

  console.log('[WiFi-Monitor] 🎯 Starting FUNCTIONAL WiFi monitoring for:', window.location.hostname);

  // RESTORED: Proper state management
  let lastConnectivityCheck = 0;
  let connectivityFailures = 0;
  let loginInProgress = false;
  let monitoringStarted = false;
  
  // INSTANT: Ultra-fast WiFi disconnection detection
  async function testConnectivity() {
    const now = Date.now();
    
    // INSTANT: Reduced cooldown to 1 second for faster detection
    if (now - lastConnectivityCheck < 1000) {
      console.log('[WiFi-Monitor] ⏳ Connectivity check cooldown active');
      return true; // Assume connected during cooldown
    }
    
    lastConnectivityCheck = now;
    
    try {
      console.log('[WiFi-Monitor] ⚡ INSTANT connectivity test...');
      
      const isHttps = window.location.protocol === 'https:';
      
      if (isHttps) {
        // For HTTPS sites: Use fastest possible endpoints with aggressive timeout
        console.log('[WiFi-Monitor] HTTPS site - INSTANT endpoint testing');
        
        const testUrls = [
          'https://www.google.com/generate_204',
          'https://cloudflare.com/cdn-cgi/trace'
        ];
        
        // Test endpoints in parallel for maximum speed
        const testPromises = testUrls.map(url => {
          const controller = new AbortController();
          setTimeout(() => controller.abort(), 1500); // Reduced from 4000ms to 1500ms
          
          return fetch(url, {
            method: 'HEAD',
            mode: 'no-cors',
            cache: 'no-cache',
            signal: controller.signal
          }).then(() => {
            console.log('[WiFi-Monitor] ⚡ INSTANT HTTPS connectivity confirmed:', url);
            return true;
          }).catch(error => {
            console.log('[WiFi-Monitor] ⚠️ HTTPS endpoint failed fast:', url, error.name);
            return false;
          });
        });
        
        // Wait for first successful response (race condition)
        const results = await Promise.allSettled(testPromises);
        const hasConnection = results.some(result => result.status === 'fulfilled' && result.value === true);
        
        if (hasConnection) {
          connectivityFailures = 0;
          return true;
        }
        
        // All HTTPS endpoints failed - WiFi likely signed out
        console.log('[WiFi-Monitor] 🚨 INSTANT: All HTTPS endpoints failed - WiFi disconnected!');
        connectivityFailures++;
        return false;
        
      } else {
        // For HTTP sites: Use fastest connectivity check endpoints
        console.log('[WiFi-Monitor] HTTP site - INSTANT connectivity testing');
        
        const testUrls = [
          'http://connectivitycheck.gstatic.com/generate_204',
          'http://www.msftconnecttest.com/connecttest.txt'
        ];
        
        // Test in parallel for maximum speed
        const testPromises = testUrls.map(url => {
          const controller = new AbortController();
          setTimeout(() => controller.abort(), 1500); // Reduced timeout
          
          return fetch(url, {
            method: 'HEAD',
            mode: 'no-cors',
            cache: 'no-cache',
            signal: controller.signal
          }).then(() => {
            console.log('[WiFi-Monitor] ⚡ INSTANT HTTP connectivity confirmed:', url);
            return true;
          }).catch(error => {
            console.log('[WiFi-Monitor] ⚠️ HTTP endpoint failed fast:', url, error.name);
            return false;
          });
        });
        
        const results = await Promise.allSettled(testPromises);
        const hasConnection = results.some(result => result.status === 'fulfilled' && result.value === true);
        
        if (hasConnection) {
          connectivityFailures = 0;
          return true;
        }
        
        // All HTTP endpoints failed - likely captive portal
        console.log('[WiFi-Monitor] 🚨 INSTANT: All HTTP endpoints failed - captive portal detected!');
        connectivityFailures++;
        return false;
      }
      
    } catch (error) {
      console.error('[WiFi-Monitor] INSTANT connectivity test error:', error);
      connectivityFailures++;
      return false;
    }
  }

  // INSTANT: Attempt login when connectivity fails
  async function attemptLogin() {
    if (loginInProgress) {
      console.log('[WiFi-Monitor] ⏳ Login already in progress, skipping');
      return;
    }
    
    console.log('[WiFi-Monitor] ⚡ INSTANT WIFI SIGN-OUT DETECTED! Starting FAST login...');
    loginInProgress = true;
    
    try {
      // INSTANT: Request background login from service worker immediately
      const response = await chrome.runtime.sendMessage({ 
        action: 'backgroundLogin',
        currentUrl: window.location.href,
        priority: 'instant' // Flag for immediate processing
      });
      
      if (response && response.success) {
        console.log('[WiFi-Monitor] ⚡ INSTANT background login initiated:', response.method);
      } else {
        console.log('[WiFi-Monitor] ⚠️ Background login failed:', response?.message || 'No response');
      }
      
    } catch (error) {
      console.error('[WiFi-Monitor] Login request failed:', error);
    } finally {
      // FASTER: Reset login flag after 10 seconds (reduced from 20)
      setTimeout(() => {
        loginInProgress = false;
        console.log('[WiFi-Monitor] 🔄 Login flag reset - ready for next INSTANT detection');
      }, 10000);
    }
  }

  // RESTORED: Video position management for seamless experience
  const VideoPositionManager = {
    save: function() {
      try {
        const videos = document.querySelectorAll('video');
        videos.forEach((video, index) => {
          if (video.currentTime > 0 && video.duration > 0) {
            const key = `video_position_${window.location.hostname}_${index}`;
            const data = {
              currentTime: video.currentTime,
              duration: video.duration,
              src: video.src || video.currentSrc,
              timestamp: Date.now()
            };
            localStorage.setItem(key, JSON.stringify(data));
            console.log('[WiFi-Monitor] 💾 Saved video position for seamless experience:', video.currentTime);
          }
        });
      } catch (error) {
        console.error('[WiFi-Monitor] Error saving video positions:', error);
      }
    },
    
    restore: function() {
      try {
        setTimeout(() => {
          const videos = document.querySelectorAll('video');
          videos.forEach((video, index) => {
            const key = `video_position_${window.location.hostname}_${index}`;
            const saved = localStorage.getItem(key);
            
            if (saved) {
              const data = JSON.parse(saved);
              // Only restore if saved within last 5 minutes
              if (Date.now() - data.timestamp < 300000) {
                video.currentTime = data.currentTime;
                console.log('[WiFi-Monitor] ⏮️ Restored video position for seamless experience:', data.currentTime);
                localStorage.removeItem(key); // Clean up
              }
            }
          });
        }, 1000);
      } catch (error) {
        console.error('[WiFi-Monitor] Error restoring video positions:', error);
      }
    }
  };

  // RESTORED: Video monitoring for seamless experience
  function setupVideoMonitoring() {
    const videos = document.querySelectorAll('video');
    
    videos.forEach((video, index) => {
      if (!video.hasAttribute('data-wifi-monitored')) {
        video.setAttribute('data-wifi-monitored', 'true');
        
        // Save position periodically while playing
        video.addEventListener('timeupdate', () => {
          if (video.currentTime > 0) {
            VideoPositionManager.save();
          }
        });
        
        // Save position when paused
        video.addEventListener('pause', () => {
          VideoPositionManager.save();
        });
        
        console.log('[WiFi-Monitor] 📹 Video monitoring setup for seamless experience on video', index);
      }
    });
  }

  // RESTORED: Aggressive network error monitoring for instant detection
  function monitorNetworkErrors() {
    console.log('[WiFi-Monitor] 🕸️ Setting up aggressive network error monitoring');
    
    // INSTANT: Monitor fetch failures globally for instant WiFi detection
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
      try {
        const response = await originalFetch.apply(this, args);
        
        // If we get successful responses, connectivity is working
        if (response.ok || response.status < 500) {
          connectivityFailures = Math.max(0, connectivityFailures - 1);
        }
        
        return response;
        
      } catch (error) {
        // INSTANT: Network error detected - possible WiFi sign-out
        console.log('[WiFi-Monitor] ⚡ INSTANT network error detected:', error.name);
        connectivityFailures++;
        
        // INSTANT: If just 1 network error, immediately test connectivity
        if (connectivityFailures >= 1) {
          console.log('[WiFi-Monitor] ⚠️ Network error - testing connectivity INSTANTLY');
          const hasInternet = await testConnectivity();
          if (!hasInternet) {
            console.log('[WiFi-Monitor] 🚨 CONFIRMED INSTANTLY: WiFi signed out! Starting FAST login...');
            await attemptLogin();
          }
        }
        
        throw error;
      }
    };
  }

  // RESTORED: Frequent periodic monitoring for instant WiFi detection
  function startPeriodicMonitoring() {
    if (monitoringStarted) {
      console.log('[WiFi-Monitor] ⚠️ Monitoring already started');
      return;
    }
    
    monitoringStarted = true;
    console.log('[WiFi-Monitor] ⏰ Starting aggressive periodic WiFi monitoring');
    
    // INSTANT: Check connectivity every 3 seconds for maximum speed
    setInterval(async () => {
      if (!loginInProgress) {
        console.log('[WiFi-Monitor] ⚡ INSTANT periodic WiFi check...');
        const hasInternet = await testConnectivity();
        if (!hasInternet) {
          console.log('[WiFi-Monitor] 🚨 INSTANT periodic check: WiFi SIGNED OUT! Starting FAST login...');
          await attemptLogin();
        }
      }
    }, 3000); // Reduced from 8000ms to 3000ms for INSTANT detection
    
    // Setup video monitoring every 2 seconds for new videos
    setInterval(() => {
      setupVideoMonitoring();
    }, 2000); // Reduced from 3000ms to 2000ms
  }

  // RESTORED: Initialize everything when page loads
  async function initialize() {
    try {
      console.log('[WiFi-Monitor] 🚀 Initializing FUNCTIONAL WiFi monitoring...');
      
      // Wait for page to be ready
      if (document.readyState === 'loading') {
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', resolve, { once: true });
        });
      }
      
      // Restore video positions if available
      VideoPositionManager.restore();
      
      // Setup aggressive network error monitoring
      monitorNetworkErrors();
      
      // Setup initial video monitoring
      setupVideoMonitoring();
      
      // Start aggressive periodic monitoring
      startPeriodicMonitoring();
      
      console.log('[WiFi-Monitor] ✅ FUNCTIONAL WiFi monitoring active on', window.location.hostname);
      
    } catch (error) {
      console.error('[WiFi-Monitor] Initialization error:', error);
    }
  }

  // Start monitoring
  initialize();

})();
