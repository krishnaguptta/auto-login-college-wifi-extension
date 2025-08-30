// Content script for auto-login - HTTP request approach with loop prevention
(async () => {
  // Prevent multiple executions
  if (window.autoLoginExecuted) {
    console.log('[AutoLogin] Already executed, skipping...');
    return;
  }
  window.autoLoginExecuted = true;

  if (document.readyState === 'loading') {
    await new Promise((res) => document.addEventListener('DOMContentLoaded', res, { once: true }));
  }

  // Check if we're on the captive portal
  if (!window.location.hostname.includes('192.168.1.254')) {
    return; // Not on captive portal, exit
  }

  console.log('[AutoLogin] Running on captive portal page');

  const settings = await chrome.storage.local.get({ username: '', password: '', autoSubmit: true });
  if (!settings.username || !settings.password) {
    console.log('[AutoLogin] No credentials found');
    return;
  }

  // Check if we've already processed this page recently
  const lastProcessed = sessionStorage.getItem('autoLoginLastProcessed');
  const now = Date.now();
  if (lastProcessed && (now - parseInt(lastProcessed)) < 5000) { // 5 second cooldown
    console.log('[AutoLogin] Recently processed, skipping to prevent loop');
    return;
  }
  sessionStorage.setItem('autoLoginLastProcessed', now.toString());

  // Wait for page to fully load
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Fill the form fields (for visual feedback)
  const userEl = document.querySelector('#username') || document.querySelector('[name="username"]');
  const passEl = document.querySelector('#password') || document.querySelector('[name="password"]');
  
  if (userEl && passEl) {
    console.log('[AutoLogin] Filling credentials for visual feedback...');
    userEl.value = settings.username;
    userEl.dispatchEvent(new Event('input', { bubbles: true }));
    passEl.value = settings.password;
    passEl.dispatchEvent(new Event('input', { bubbles: true }));
  }

  if (settings.autoSubmit) {
    console.log('[AutoLogin] Attempting HTTP request method...');
    
    try {
      // Method 1: Try to get form data and submit via fetch
      const form = document.querySelector('form');
      if (form) {
        const formData = new FormData(form);
        
        // Ensure our credentials are in the form data
        formData.set('username', settings.username);
        formData.set('password', settings.password);
        
        // Add any hidden fields that might be required
        const hiddenInputs = form.querySelectorAll('input[type="hidden"]');
        hiddenInputs.forEach(input => {
          if (input.name && input.value) {
            formData.set(input.name, input.value);
          }
        });

        console.log('[AutoLogin] Submitting via fetch request...');
        
        const response = await fetch(form.action || window.location.href, {
          method: form.method || 'POST',
          body: formData,
          credentials: 'same-origin',
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        });

        console.log('[AutoLogin] Response status:', response.status);
        
        if (response.ok || response.redirected) {
          console.log('[AutoLogin] Login successful via HTTP request');
          
          // Mark as successful to prevent further attempts
          sessionStorage.setItem('autoLoginSuccess', 'true');
          chrome.runtime.sendMessage({ action: 'loginSuccess' });
          
          // If we got redirected, follow it
          if (response.redirected) {
            console.log('[AutoLogin] Following redirect to:', response.url);
            window.location.href = response.url;
          } else {
            // Check response content for success
            const responseText = await response.text();
            if (responseText.toLowerCase().includes('success') || 
                responseText.toLowerCase().includes('logged')) {
              console.log('[AutoLogin] Success detected, reloading page');
              window.location.reload();
            }
          }
          return; // Exit after successful login
        }
      } else {
        console.log('[AutoLogin] No form found, trying direct POST...');
        
        // Method 2: Direct POST request with common parameters
        const loginData = new URLSearchParams();
        loginData.append('username', settings.username);
        loginData.append('password', settings.password);
        loginData.append('mode', '191'); // Common parameter for this type of portal
        loginData.append('producttype', '0');
        loginData.append('a', Date.now().toString());

        const response = await fetch('https://192.168.1.254:8090/login.xml', {
          method: 'POST',
          body: loginData,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest'
          },
          credentials: 'same-origin'
        });

        console.log('[AutoLogin] Direct POST response:', response.status);
        const responseText = await response.text();
        console.log('[AutoLogin] Response text:', responseText);

        if (response.ok && (responseText.includes('SUCCESS') || responseText.includes('success'))) {
          console.log('[AutoLogin] Login successful via direct POST');
          
          // Mark as successful
          sessionStorage.setItem('autoLoginSuccess', 'true');
          chrome.runtime.sendMessage({ action: 'loginSuccess' });
          
          // Reload or redirect after successful login
          setTimeout(() => {
            window.location.reload();
          }, 1000);
          return; // Exit after successful login
        }
      }
      
    } catch (error) {
      console.error('[AutoLogin] HTTP request failed:', error);
      
      // Fallback: Try the keyboard event method as last resort
      console.log('[AutoLogin] Falling back to keyboard simulation...');
      attemptKeyboardSubmission();
    }
  }

  function attemptKeyboardSubmission() {
    const submitEl = document.querySelector('#loginbutton') || 
                     document.querySelector('input[type="submit"]') || 
                     document.querySelector('button[type="submit"]');
    
    if (submitEl) {
      console.log('[AutoLogin] Trying keyboard Enter key...');
      
      // Focus and send Enter key
      submitEl.focus();
      
      // Dispatch Enter key events
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true
      });
      
      submitEl.dispatchEvent(enterEvent);
      
      // Also try on the document
      document.dispatchEvent(enterEvent);
      
      console.log('[AutoLogin] Enter key dispatched');
      
      // Check for success
      setTimeout(() => {
        if (window.location.href !== window.location.href || 
            document.body.innerText.toLowerCase().includes('success') ||
            !document.querySelector('#username')) {
          sessionStorage.setItem('autoLoginSuccess', 'true');
          chrome.runtime.sendMessage({ action: 'loginSuccess' });
        }
      }, 3000);
    } else {
      console.log('[AutoLogin] No submit element found for keyboard fallback');
    }
  }

})().catch(error => {
  console.error('[AutoLogin] Script error:', error);
});