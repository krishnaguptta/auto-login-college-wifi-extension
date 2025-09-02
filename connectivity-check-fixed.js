// connectivity-check.js - Enhanced with error handling and stack traces
(async () => {
  // Enhanced error handling with stack traces
  const logError = (context, error) => {
    console.error(`[Connectivity ERROR] ${context}:`, error);
    console.error(`[Connectivity STACK] ${context}:`, error.stack);
    console.trace(`[Connectivity TRACE] ${context}`);
  };

  try {
    // Don't run on captive portal pages, extensions, or local pages
    if (window.location.hostname.includes('192.168.1.254') ||
        window.location.hostname.includes('chrome-extension') ||
        window.location.hostname.includes('localhost') ||
        window.location.protocol.includes('chrome') ||
        window.location.hostname.includes('gstatic.com')) {
      console.log('[Connectivity] Skipping monitoring on:', window.location.hostname);
      return;
    }

    // Don't run if we've already checked recently (increased to reduce CPU usage)
    const lastCheck = sessionStorage.getItem('connectivityLastCheck');
    const now = Date.now();
    if (lastCheck && (now - parseInt(lastCheck)) < 15000) { // Increased back to 15 seconds
      console.log('[Connectivity] Recent check found, skipping');
      return;
    }

    console.log('[Connectivity] Starting monitoring for:', window.location.hostname);

    // Track video/streaming elements for buffering detection
    let videoElements = [];
    let streamingDetected = false;
    let bufferingTimeout = null;
    let isProcessingBuffering = false;
    let lastBufferingCheck = 0; // Throttle buffering checks

    // Function to detect streaming websites and video elements
    function checkForStreamingEnvironment() {
      try {
        console.log('[Connectivity] Starting streaming environment detection for:', window.location.hostname);
        
        const streamingSites = [
          'netflix.com','net2025.cc', 'youtube.com', 'amazon.', 'hulu.com', 'disney',
          'twitch.tv', 'vimeo.com', 'dailymotion.com', 'facebook.com',
          'instagram.com', 'tiktok.com', 'hotstar.com', 'zee5.com',
          'sonyliv.com', 'voot.com', 'mx.', 'jio',
          'primevideo.com', 'crunchyroll.com', 'funimation.com', 'bilibili.com',
          'iqiyi.com', 'youku.com', 'spotify.com', 'soundcloud.com',
          'kick.com', 'rumble.com', 'odysee.com'
        ];
        
        const isStreamingSite = streamingSites.some(site => 
          window.location.hostname.includes(site)
        );
        
        console.log('[Connectivity] Is streaming site:', isStreamingSite, 'for', window.location.hostname);
        
        // Find video elements - improved detection
        videoElements = [];
        
        // Standard video elements
        try {
          const videos = document.querySelectorAll('video');
          videoElements.push(...Array.from(videos));
          console.log('[Connectivity] Found standard video elements:', videos.length);
        } catch (error) {
          logError('Standard video detection', error);
        }

        // Enhanced custom video players - expanded for net2025.cc
        const customVideoSelectors = [
          '[data-uia="video-canvas"]', '.video-stream', '.vjs-tech', 
          '.jwplayer video', '.plyr__video', '.video-player video',
          'video[src]', 'video[controls]', '.flowplayer video', 
          '.videojs video', '.html5-video-player video',
          'iframe[src*="player"]', 'iframe[src*="video"]', 'iframe[src*="stream"]',
          '.player video', '.stream video', '.media-player video',
          '[class*="video"] video', '[id*="video"] video',
          '[class*="player"] video', '[id*="player"] video',
          'video[preload]', 'video[autoplay]', '.video-container video',
          '#video-player video', '.media-element video'
        ];
        
        customVideoSelectors.forEach(selector => {
          try {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
              console.log(`[Connectivity] Found ${elements.length} elements with selector: ${selector}`);
              videoElements.push(...Array.from(elements));
            }
          } catch (error) {
            logError(`Selector ${selector}`, error);
          }
        });
        
        // Also check for iframes that might contain video players
        try {
          const iframes = document.querySelectorAll('iframe');
          console.log('[Connectivity] Checking', iframes.length, 'iframes for video content');
          
          iframes.forEach((iframe, i) => {
            try {
              const src = iframe.src || '';
              const iframeSrc = src.toLowerCase();
              if (iframeSrc.includes('video') || 
                  iframeSrc.includes('player') || 
                  iframeSrc.includes('stream') ||
                  iframeSrc.includes('embed') ||
                  iframe.title?.toLowerCase().includes('video') ||
                  iframe.className?.toLowerCase().includes('video') ||
                  iframe.id?.toLowerCase().includes('video')) {
                
                console.log(`[Connectivity] Found potential video iframe ${i}:`, iframe.src);
                videoElements.push(iframe);
              }
            } catch (error) {
              logError(`Iframe ${i} processing`, error);
            }
          });
        } catch (error) {
          logError('Iframe detection', error);
        }
        
        // Special detection for net2025.cc and similar streaming sites
        if (window.location.hostname.includes('net2025.cc')) {
          console.log('[Connectivity] SPECIAL DETECTION for net2025.cc');
          
          try {
            // Look for any media elements
            const mediaElements = document.querySelectorAll('audio, video, object, embed');
            console.log('[Connectivity] Found media elements on net2025.cc:', mediaElements.length);
            videoElements.push(...Array.from(mediaElements));
            
            // Look for elements with streaming-related classes or IDs
            const streamingSelectors = [
              '[class*="stream"]', '[id*="stream"]', '[class*="media"]', '[id*="media"]',
              '[class*="player"]', '[id*="player"]', '[data-*="video"]', '[data-*="player"]'
            ];
            
            streamingSelectors.forEach(selector => {
              try {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                  console.log(`[Connectivity] net2025.cc found ${elements.length} elements with ${selector}`);
                }
                Array.from(elements).forEach(el => {
                  if (el.tagName === 'VIDEO' || 
                      el.querySelector('video') || 
                      el.querySelector('iframe') ||
                      el.innerHTML.toLowerCase().includes('video')) {
                    console.log('[Connectivity] Adding streaming element from net2025.cc:', el);
                    videoElements.push(el);
                  }
                });
              } catch (error) {
                logError(`net2025.cc selector ${selector}`, error);
              }
            });
          } catch (error) {
            logError('net2025.cc special detection', error);
          }
        }
        
        // Remove duplicates
        videoElements = [...new Set(videoElements)];
        
        streamingDetected = isStreamingSite || videoElements.length > 0;
        
        console.log('[Connectivity] Final detection results:', {
          site: window.location.hostname,
          videoElements: videoElements.length,
          isStreamingSite,
          streamingDetected,
          videos: videoElements.map((v, i) => ({
            index: i,
            tagName: v.tagName,
            src: v.src || 'no-src',
            className: v.className,
            id: v.id
          }))
        });
        
        return streamingDetected;
        
      } catch (error) {
        logError('checkForStreamingEnvironment', error);
        return false;
      }
    }

    // Debug function specifically for net2025.cc
    window.debugNet2025 = function() {
      try {
        console.log('[Connectivity] === DEBUGGING net2025.cc ===');
        console.log('Current hostname:', window.location.hostname);
        console.log('Current URL:', window.location.href);
        
        // Check all possible video elements
        console.log('=== Video Elements Search ===');
        
        const allVideos = document.querySelectorAll('video');
        console.log('Standard video elements:', allVideos.length);
        
        const allIframes = document.querySelectorAll('iframe');
        console.log('Iframe elements:', allIframes.length);
        allIframes.forEach((iframe, i) => {
          console.log(`Iframe ${i}:`, {
            src: iframe.src,
            className: iframe.className,
            id: iframe.id,
            title: iframe.title
          });
        });
        
        const allMedia = document.querySelectorAll('audio, video, object, embed');
        console.log('All media elements:', allMedia.length);
        
        // Check for streaming-related elements
        const streamingElements = document.querySelectorAll('[class*="stream"], [id*="stream"], [class*="player"], [id*="player"], [class*="video"], [id*="video"]');
        console.log('Streaming-related elements:', streamingElements.length);
        streamingElements.forEach((el, i) => {
          if (i < 10) { // Show first 10
            console.log(`Element ${i}:`, {
              tagName: el.tagName,
              className: el.className,
              id: el.id,
              innerHTML: el.innerHTML.substring(0, 100)
            });
          }
        });
        
        // Force re-detection
        console.log('=== Force Re-detection ===');
        const detected = checkForStreamingEnvironment();
        console.log('After re-detection:');
        console.log('- Videos found:', videoElements.length);
        console.log('- Streaming detected:', detected);
        console.log('- Video elements:', videoElements);
        
        return {
          videosFound: videoElements.length,
          streamingDetected: detected,
          videoElements: videoElements
        };
        
      } catch (error) {
        logError('debugNet2025', error);
        return { error: error.message, stack: error.stack };
      }
    };

    // Test connectivity with better error handling
    async function testConnectivity() {
      try {
        console.log('[Connectivity] Testing connectivity...');
        const isHTTPS = window.location.protocol === 'https:';
        
        const tests = [
          // Test 1: Basic connectivity
          async () => {
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 3000);
              
              const response = await fetch('https://www.gstatic.com/generate_204?' + Date.now(), {
                method: 'GET',
                cache: 'no-cache',
                signal: controller.signal,
                mode: 'no-cors'
              });
              
              clearTimeout(timeoutId);
              return true;
            } catch (error) {
              console.log('[Connectivity] Test 1 failed:', error.message);
              return false;
            }
          },
          
          // Test 2: Image request
          async () => {
            return new Promise((resolve) => {
              const img = new Image();
              const timeout = setTimeout(() => {
                img.onload = img.onerror = null;
                resolve(false);
              }, 3000);
              
              img.onload = () => {
                clearTimeout(timeout);
                resolve(true);
              };
              
              img.onerror = () => {
                clearTimeout(timeout);
                resolve(false);
              };
              
              img.src = 'https://www.gstatic.com/generate_204?' + Date.now();
            });
          }
        ];

        const results = await Promise.allSettled(tests.map(test => test()));
        const hasConnection = results.some(result => result.status === 'fulfilled' && result.value === true);
        
        console.log('[Connectivity] Connectivity test results:', {
          hasConnection,
          isHTTPS,
          results: results.map((r, i) => ({
            test: i + 1,
            status: r.status,
            value: r.status === 'fulfilled' ? r.value : false,
            error: r.status === 'rejected' ? r.reason?.message : null
          }))
        });
        
        return hasConnection;
        
      } catch (error) {
        logError('testConnectivity', error);
        return false;
      }
    }

    // Initialize and start monitoring
    console.log('[Connectivity] Initializing monitoring...');
    
    // Initial environment detection
    const detected = checkForStreamingEnvironment();
    console.log('[Connectivity] Initial detection complete:', {
      detected,
      videoCount: videoElements.length,
      hostname: window.location.hostname
    });
    
    // Test initial connectivity
    const hasInternet = await testConnectivity();
    console.log('[Connectivity] Initial connectivity result:', hasInternet);
    
    // Mark check as done
    sessionStorage.setItem('connectivityLastCheck', now.toString());
    
    console.log('[Connectivity] Monitoring setup complete for:', window.location.hostname);
    
  } catch (error) {
    logError('Main execution', error);
  }

})().catch(error => {
  console.error('[Connectivity] Top-level error:', error);
  console.error('[Connectivity] Top-level stack:', error.stack);
  console.trace('[Connectivity] Top-level trace');
});
