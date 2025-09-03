// connectivity-check.js - Simplified version for basic functionality
console.log('[Connectivity] Script loaded on:', window.location.href);

(async () => {
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

    console.log('[Connectivity] Starting simple connectivity check for:', window.location.hostname);

    // Video position restoration system
    const VideoPositionManager = {
      storeVideoPosition: function(video, context = 'buffering') {
        try {
          if (video && video.currentTime && video.duration) {
            const videoData = {
              currentTime: video.currentTime,
              duration: video.duration,
              src: video.src || video.currentSrc,
              url: window.location.href,
              timestamp: Date.now(),
              context: context,
              videoIndex: Array.from(document.querySelectorAll('video')).indexOf(video)
            };
            
            console.log('[VideoPosition] Storing video position:', videoData);
            localStorage.setItem('videoPosition_' + window.location.hostname, JSON.stringify(videoData));
            sessionStorage.setItem('lastVideoPosition', JSON.stringify(videoData));
            
            return videoData;
          }
        } catch (error) {
          console.error('[VideoPosition] Store error:', error);
        }
        return null;
      },

      restoreVideoPosition: function() {
        try {
          const stored = localStorage.getItem('videoPosition_' + window.location.hostname);
          const sessionStored = sessionStorage.getItem('lastVideoPosition');
          
          if (stored || sessionStored) {
            const videoData = JSON.parse(sessionStored || stored);
            console.log('[VideoPosition] Found stored position:', videoData);
            
            // Check if this is recent (within 10 minutes)
            const timeDiff = Date.now() - videoData.timestamp;
            if (timeDiff < 600000) { // 10 minutes
              this.attemptRestore(videoData);
              return videoData;
            } else {
              console.log('[VideoPosition] Stored position too old, ignoring');
            }
          }
        } catch (error) {
          console.error('[VideoPosition] Restore error:', error);
        }
        return null;
      },

      attemptRestore: function(videoData) {
        try {
          const attempts = 10; // Try for 10 seconds
          let currentAttempt = 0;
          
          const restoreInterval = setInterval(() => {
            currentAttempt++;
            const videos = document.querySelectorAll('video');
            
            if (videos.length > 0) {
              let targetVideo = null;
              
              // Try to find the exact video
              if (videoData.videoIndex !== undefined && videos[videoData.videoIndex]) {
                targetVideo = videos[videoData.videoIndex];
              } else {
                // Fallback to first video
                targetVideo = videos[0];
              }
              
              if (targetVideo && targetVideo.duration && !isNaN(targetVideo.duration)) {
                console.log('[VideoPosition] Restoring position to:', videoData.currentTime);
                
                // Set the time
                targetVideo.currentTime = videoData.currentTime;
                
                // Show notification
                this.showRestoreNotification(videoData);
                
                clearInterval(restoreInterval);
                
                // Clean up stored position
                setTimeout(() => {
                  localStorage.removeItem('videoPosition_' + window.location.hostname);
                  sessionStorage.removeItem('lastVideoPosition');
                }, 2000);
                
                return;
              }
            }
            
            if (currentAttempt >= attempts) {
              console.log('[VideoPosition] Failed to restore after', attempts, 'attempts');
              clearInterval(restoreInterval);
            }
          }, 1000);
          
        } catch (error) {
          console.error('[VideoPosition] Restore attempt error:', error);
        }
      },

      showRestoreNotification: function(videoData) {
        try {
          const notification = document.createElement('div');
          notification.style.cssText = `
            position: fixed; top: 20px; left: 20px; background: #4CAF50; color: white;
            padding: 12px 20px; border-radius: 6px; z-index: 999999; font-family: Arial;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3); font-size: 14px;
          `;
          
          const minutes = Math.floor(videoData.currentTime / 60);
          const seconds = Math.floor(videoData.currentTime % 60).toString().padStart(2, '0');
          
          notification.innerHTML = `
            ✅ Video position restored to ${minutes}:${seconds}
          `;
          
          document.body.appendChild(notification);
          
          setTimeout(() => {
            if (notification.parentNode) {
              notification.remove();
            }
          }, 4000);
        } catch (error) {
          console.error('[VideoPosition] Notification error:', error);
        }
      }
    };

    // Track videos and buffering state
    let videoElements = [];
    let isProcessingBuffering = false;
    let lastBufferingCheck = 0;

    // Function to detect video elements and streaming sites
    function detectVideosAndStreaming() {
      try {
        console.log('[Connectivity] Detecting videos on:', window.location.hostname);
        
        const streamingSites = [
          'netflix.com', 'net2025.cc', 'youtube.com', 'amazon.', 'hulu.com', 'disney',
          'twitch.tv', 'vimeo.com', 'dailymotion.com', 'facebook.com',
          'instagram.com', 'tiktok.com', 'hotstar.com', 'zee5.com',
          'sonyliv.com', 'voot.com', 'primevideo.com', 'crunchyroll.com'
        ];
        
        const isStreamingSite = streamingSites.some(site => 
          window.location.hostname.includes(site)
        );
        
        // Clear previous list
        videoElements = [];
        
        // Find video elements with multiple selectors
        const videoSelectors = [
          'video',
          'video[src]',
          'video[controls]',
          '.html5-video-player video',
          '.video-stream',
          '.vjs-tech',
          '[data-uia="video-canvas"]'
        ];
        
        videoSelectors.forEach(selector => {
          try {
            const found = document.querySelectorAll(selector);
            if (found.length > 0) {
              console.log(`[Connectivity] Found ${found.length} elements with selector: ${selector}`);
              videoElements.push(...Array.from(found));
            }
          } catch (e) {
            // Ignore selector errors
          }
        });
        
        // Remove duplicates
        videoElements = [...new Set(videoElements)];
        
        console.log('[Connectivity] TOTAL videos found:', videoElements.length, 'on streaming site:', isStreamingSite);
        
        // Log details of each video found
        videoElements.forEach((video, i) => {
          console.log(`[Connectivity] Video ${i}:`, {
            src: video.src || video.currentSrc || 'no-src',
            duration: video.duration || 'no-duration',
            readyState: video.readyState,
            paused: video.paused
          });
        });
        
        return { isStreamingSite, videoCount: videoElements.length };
        
      } catch (error) {
        console.error('[Connectivity] Video detection error:', error);
        return { isStreamingSite: false, videoCount: 0 };
      }
    }

    // Monitor video buffering events
    function setupVideoMonitoring() {
      try {
        console.log('[Connectivity] Setting up ENHANCED monitoring for', videoElements.length, 'videos');
        
        videoElements.forEach((video, index) => {
          try {
            if (video instanceof HTMLVideoElement && !video.hasAttribute('data-monitored')) {
              console.log(`[Connectivity] MONITORING video ${index} - src:`, video.src || video.currentSrc || 'none');
              video.setAttribute('data-monitored', 'true');
              
              // INSTANT buffering detection with more events
              const bufferingEvents = ['waiting', 'stalled', 'error', 'suspend'];
              bufferingEvents.forEach(eventType => {
                video.addEventListener(eventType, () => {
                  console.log(`[Connectivity] Video ${index} ${eventType.toUpperCase()} - BUFFERING DETECTED!`);
                  handleVideoBuffering(video, eventType);
                }, { passive: true });
              });
              
              // Network state monitoring
              video.addEventListener('loadstart', () => {
                console.log(`[Connectivity] Video ${index} loadstart`);
              }, { passive: true });
              
              video.addEventListener('progress', () => {
                // Reset processing when video recovers
                if (isProcessingBuffering) {
                  console.log(`[Connectivity] Video ${index} progress - buffering resolved`);
                  isProcessingBuffering = false;
                }
              }, { passive: true });
              
              // Additional recovery events
              ['canplay', 'playing', 'loadeddata'].forEach(event => {
                video.addEventListener(event, () => {
                  if (isProcessingBuffering) {
                    console.log(`[Connectivity] Video ${index} ${event} - buffering resolved`);
                    isProcessingBuffering = false;
                  }
                }, { passive: true });
              });
              
              // Log video state changes for debugging
              video.addEventListener('play', () => console.log(`[Connectivity] Video ${index} PLAY`), { passive: true });
              video.addEventListener('pause', () => console.log(`[Connectivity] Video ${index} PAUSE`), { passive: true });
              
            }
          } catch (error) {
            console.error(`[Connectivity] Error monitoring video ${index}:`, error);
          }
        });
        
        console.log('[Connectivity] Video monitoring setup COMPLETE for', videoElements.length, 'videos');
        
      } catch (error) {
        console.error('[Connectivity] Video monitoring setup error:', error);
      }
    }

    // Handle video buffering with position storage
    function handleVideoBuffering(video, eventType) {
      try {
        const now = Date.now();
        if (now - lastBufferingCheck < 1000) { // Reduced throttle to 1 second
          return;
        }
        lastBufferingCheck = now;
        
        if (isProcessingBuffering) {
          console.log('[Connectivity] Already processing buffering, skipping');
          return;
        }
        
        isProcessingBuffering = true;
        console.log(`[Connectivity] ⚠️ BUFFERING DETECTED via ${eventType} - IMMEDIATE ACTION!`);
        
        // Store video position IMMEDIATELY when buffering starts
        const videoData = VideoPositionManager.storeVideoPosition(video, eventType);
        console.log('[Connectivity] Video position stored:', videoData);
        
        // Show buffering notification immediately
        if (videoData) {
          showBufferingNotification(videoData);
        }
        
        // For certain events, redirect immediately without testing (faster response)
        if (eventType === 'stalled' || eventType === 'error') {
          console.log('[Connectivity] Critical buffering event - IMMEDIATE REDIRECT');
          triggerCaptivePortal();
          return;
        }
        
        // For other events, do a quick connectivity test
        console.log('[Connectivity] Testing connectivity...');
        testConnectivity().then(hasInternet => {
          console.log('[Connectivity] Connectivity test result:', hasInternet);
          if (!hasInternet) {
            console.log('[Connectivity] No internet during buffering - INSTANT redirect');
            triggerCaptivePortal();
          } else {
            console.log('[Connectivity] Internet OK but video buffering - might be temporary');
            // Wait a bit and test again
            setTimeout(() => {
              testConnectivity().then(stillHasInternet => {
                if (!stillHasInternet) {
                  console.log('[Connectivity] Internet lost during buffering - redirecting');
                  triggerCaptivePortal();
                } else {
                  isProcessingBuffering = false;
                }
              });
            }, 2000);
          }
        }).catch(error => {
          console.log('[Connectivity] Connectivity test failed:', error, '- redirecting');
          triggerCaptivePortal();
        });
        
      } catch (error) {
        console.error('[Connectivity] Video buffering handler error:', error);
        // If there's an error, still try to redirect as a fallback
        triggerCaptivePortal();
      }
    }

    // Show buffering notification
    function showBufferingNotification(videoData) {
      try {
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed; top: 20px; right: 20px; background: #FF5722; color: white;
          padding: 15px 20px; border-radius: 8px; z-index: 999999; font-family: Arial;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3); font-size: 14px; max-width: 300px;
        `;
        
        const minutes = Math.floor(videoData.currentTime / 60);
        const seconds = Math.floor(videoData.currentTime % 60).toString().padStart(2, '0');
        
        notification.innerHTML = `
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 20px; height: 20px; border: 2px solid white; border-top: transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <div>
              <strong>Video Buffering!</strong><br>
              <small>Position saved: ${minutes}:${seconds} | Reconnecting...</small>
            </div>
          </div>
          <style>
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 5000);
        
      } catch (error) {
        console.error('[Connectivity] Buffering notification error:', error);
      }
    }

    // Wait for page to be ready
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve, { once: true });
      });
    }

    // Initialize - Try to restore video position first
    console.log('[Connectivity] Initializing...');
    VideoPositionManager.restoreVideoPosition();
    
    // Detect videos and set up monitoring
    const detection = detectVideosAndStreaming();
    if (detection.videoCount > 0) {
      setupVideoMonitoring();
    }
    
    // Monitor for new videos on streaming sites
    if (detection.isStreamingSite) {
      setInterval(() => {
        const oldCount = videoElements.length;
        detectVideosAndStreaming();
        if (videoElements.length > oldCount) {
          console.log('[Connectivity] New videos detected, setting up monitoring');
          setupVideoMonitoring();
        }
      }, 3000);
    }

    // Debug functions for testing
    window.debugNet2025 = function() {
      try {
        console.log('[Debug] === Debug Info ===');
        console.log('Hostname:', window.location.hostname);
        console.log('Total videos in DOM:', document.querySelectorAll('video').length);
        console.log('Monitored videos:', videoElements.length);
        
        // Show details of each video
        videoElements.forEach((video, i) => {
          console.log(`Video ${i}:`, {
            src: video.src || video.currentSrc || 'no-src',
            duration: video.duration,
            currentTime: video.currentTime,
            paused: video.paused,
            readyState: video.readyState,
            networkState: video.networkState,
            buffered: video.buffered.length,
            monitored: video.hasAttribute('data-monitored')
          });
        });
        
        const detection = detectVideosAndStreaming();
        console.log('Detection results:', detection);
        
        return {
          ...detection,
          totalVideos: document.querySelectorAll('video').length,
          monitoredVideos: videoElements.length
        };
      } catch (error) {
        console.error('[Debug] Error:', error);
        return { error: error.message };
      }
    };

    window.testVideoBuffering = function() {
      console.log('[Debug] === Testing Video Buffering ===');
      const videos = document.querySelectorAll('video');
      console.log('[Debug] Found', videos.length, 'videos in DOM');
      
      if (videos.length > 0) {
        console.log('[Debug] Simulating buffering on first video...');
        handleVideoBuffering(videos[0], 'manual-test');
        return { success: true, videoCount: videos.length };
      } else {
        console.log('[Debug] No videos found to test');
        return { success: false, videoCount: 0 };
      }
    };

    window.forceRedirect = function() {
      console.log('[Debug] === Force Redirect Test ===');
      triggerCaptivePortal();
      return { action: 'redirect-triggered' };
    };

    // Simple connectivity test
    async function testConnectivity() {
      try {
        console.log('[Connectivity] Testing internet connection...');
        
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('https://www.gstatic.com/generate_204?' + Date.now(), {
          method: 'GET',
          cache: 'no-cache',
          signal: controller.signal,
          mode: 'no-cors'
        });
        
        console.log('[Connectivity] Internet test result: SUCCESS');
        return true;
        
      } catch (error) {
        console.log('[Connectivity] Internet test result: FAILED -', error.message);
        return false;
      }
    }

    // Trigger captive portal
    async function triggerCaptivePortal() {
      try {
        console.log('[Connectivity] No internet detected - triggering captive portal...');
        
        // Try to message background script
        try {
          const response = await chrome.runtime.sendMessage({
            action: 'triggerCaptivePortal',
            currentUrl: window.location.href,
            fromStreaming: false
          });
          console.log('[Connectivity] Background script response:', response);
        } catch (error) {
          console.log('[Connectivity] Background script unavailable, using direct navigation');
          window.location.href = 'http://www.gstatic.com/generate_204?' + Date.now();
        }
        
      } catch (error) {
        console.error('[Connectivity] Error triggering captive portal:', error);
      }
    }

    // Wait for page to be ready
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve, { once: true });
      });
    }

    // Test connectivity when page loads - INSTANT redirect if no internet
    console.log('[Connectivity] Page ready, testing connectivity...');
    const hasInternet = await testConnectivity();
    
    if (!hasInternet) {
      console.log('[Connectivity] No internet detected on page load - INSTANT redirect');
      triggerCaptivePortal(); // Removed await to make it instant
    } else {
      console.log('[Connectivity] Internet connection is working');
    }
    
    console.log('[Connectivity] Simple setup complete');
    
  } catch (error) {
    console.error('[Connectivity] Main execution error:', error);
  }

})().catch(error => {
  console.error('[Connectivity] Top-level error:', error);
});
