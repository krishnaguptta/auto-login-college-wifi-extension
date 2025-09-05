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

  // Check if we're on the captive portal or connectivity check page
  if (!window.location.hostname.includes('192.168.1.254') && 
      !window.location.hostname.includes('gstatic.com')) {
    return; // Not on captive portal or connectivity check, exit
  }

  console.log('[AutoLogin] Running on captive portal or connectivity check page');

  // Special handling for gstatic.com connectivity check page
  if (window.location.hostname.includes('gstatic.com')) {
    console.log('[AutoLogin] Detected gstatic.com connectivity check page');
    
    // This page is usually just a connectivity test, mark as direct login for auto-close
    setTimeout(() => {
      console.log('[AutoLogin] Connectivity check complete, requesting auto-close');
      chrome.runtime.sendMessage({ action: 'loginSuccess' });
    }, 2000); // Wait 2 seconds for any connectivity check to complete
    
    return; // Exit early for gstatic pages
  }

  const settings = await chrome.storage.local.get({ username: '', password: '', autoSubmit: true });
  if (!settings.username || !settings.password) {
    console.log('[AutoLogin] No credentials found');
    return;
  }

  // Check if we've already processed this page recently
  const lastProcessed = sessionStorage.getItem('autoLoginLastProcessed');
  const now = Date.now();
  if (lastProcessed && (now - parseInt(lastProcessed)) < 3000) { // Reduced from 5000ms to 3000ms
    console.log('[AutoLogin] Recently processed, skipping to prevent loop');
    return;
  }
  sessionStorage.setItem('autoLoginLastProcessed', now.toString());

  // INSTANT: Wait minimal time for page to load
  await new Promise(resolve => setTimeout(resolve, 200)); // Reduced to 200ms for INSTANT execution

  console.log('[AutoLogin] ⚡ INSTANT credential filling and submission starting...');

  // Fill the form fields INSTANTLY
  const userEl = document.querySelector('#username') || document.querySelector('[name="username"]');
  const passEl = document.querySelector('#password') || document.querySelector('[name="password"]');
  
  if (userEl && passEl) {
    console.log('[AutoLogin] ⚡ INSTANT credential filling...');
    userEl.value = settings.username;
    userEl.dispatchEvent(new Event('input', { bubbles: true }));
    userEl.dispatchEvent(new Event('change', { bubbles: true }));
    passEl.value = settings.password;
    passEl.dispatchEvent(new Event('input', { bubbles: true }));
    passEl.dispatchEvent(new Event('change', { bubbles: true }));
    
    console.log('[AutoLogin] ⚡ Credentials filled INSTANTLY');
  }

  if (settings.autoSubmit) {
    console.log('[AutoLogin] ⚡ INSTANT AUTOMATIC SUBMISSION - MAXIMUM SPEED!');
    
    // INSTANT: Start with button clicking IMMEDIATELY (most reliable)
    const submitBtn = document.querySelector('#loginbutton') || 
                     document.querySelector('input[type="submit"]') || 
                     document.querySelector('button[type="submit"]') ||
                     document.querySelector('button[onclick*="login"]') ||
                     document.querySelector('button');

    if (submitBtn) {
      console.log('[AutoLogin] ⚡ INSTANTLY clicking submit button...');
      
      // Click IMMEDIATELY - no delay
      try {
        submitBtn.click();
        console.log('[AutoLogin] ⚡ Submit button clicked INSTANTLY');
      } catch (error) {
        console.log('[AutoLogin] ⚠️ Instant click failed:', error.message);
      }
      
      // Backup clicks with minimal delays for maximum speed
      setTimeout(() => {
        try {
          submitBtn.click();
          console.log('[AutoLogin] ⚡ Speed backup click #1 executed');
        } catch (error) {
          console.log('[AutoLogin] ⚠️ Speed backup click #1 failed:', error.message);
        }
      }, 50); // Reduced from 200ms to 50ms
      
      setTimeout(() => {
        try {
          const clickEvent = new MouseEvent('click', { 
            bubbles: true, 
            cancelable: true,
            view: window
          });
          submitBtn.dispatchEvent(clickEvent);
          console.log('[AutoLogin] ⚡ INSTANT click event dispatched');
        } catch (error) {
          console.log('[AutoLogin] ⚠️ Click event failed:', error.message);
        }
      }, 100); // Reduced from 400ms to 100ms
    }
    
    // PARALLEL: Also try HTTP submission methods
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

        console.log('[AutoLogin] 📤 PARALLEL: Auto-submitting form via fetch...');
        
        // Don't await - run in parallel with button clicks
        fetch(form.action || window.location.href, {
          method: form.method || 'POST',
          body: formData,
          credentials: 'same-origin',
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        }).then(response => {
          console.log('[AutoLogin] ✅ HTTP Form submitted! Response status:', response.status);
          
          if (response.ok || response.redirected) {
            console.log('[AutoLogin] 🎉 Login successful via HTTP request');
            notifySuccessAndClose();
            
            if (response.redirected) {
              console.log('[AutoLogin] Following redirect to:', response.url);
              window.location.href = response.url;
            }
          }
        }).catch(error => {
          console.log('[AutoLogin] ⚠️ HTTP form submission failed:', error.message);
        });
        
        // Also try direct form submission with minimal delay
        setTimeout(() => {
          try {
            form.submit();
            console.log('[AutoLogin] ⚡ INSTANT direct form.submit() executed');
          } catch (error) {
            console.log('[AutoLogin] ⚠️ form.submit() failed:', error.message);
          }
        }, 50); // Reduced from 100ms to 50ms
        
      } else {
        console.log('[AutoLogin] No form found, trying direct POST...');
        
        // Method 2: Direct POST request with common parameters
        const loginData = new URLSearchParams();
        loginData.append('username', settings.username);
        loginData.append('password', settings.password);
        loginData.append('mode', '191'); // Common parameter for this type of portal
        loginData.append('producttype', '0');
        loginData.append('a', Date.now().toString());

        console.log('[AutoLogin] 📤 PARALLEL: Auto-submitting via direct POST...');
        
        fetch('https://192.168.1.254:8090/login.xml', {
          method: 'POST',
          body: loginData,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest'
          },
          credentials: 'same-origin'
        }).then(async response => {
          console.log('[AutoLogin] ✅ Direct POST submitted! Response:', response.status);
          const responseText = await response.text();
          console.log('[AutoLogin] Response text:', responseText);

          if (response.ok && (responseText.includes('SUCCESS') || responseText.includes('success'))) {
            console.log('[AutoLogin] 🎉 Login successful via direct POST');
            notifySuccessAndClose();
          }
        }).catch(error => {
          console.log('[AutoLogin] ⚠️ Direct POST failed:', error.message);
        });
      }
      
    } catch (error) {
      console.error('[AutoLogin] ❌ HTTP methods failed:', error);
    }
    
    // INSTANT: Keyboard Enter events as backup
    setTimeout(() => {
      attemptKeyboardSubmission();
    }, 150); // Reduced from 600ms to 150ms
    
    // INSTANT: Check for success after all attempts
    setTimeout(() => {
      checkLoginSuccess();
    }, 300); // Reduced from 1000ms to 300ms
  }

  // NEW: Force form submission using multiple methods
  function forceFormSubmission() {
    console.log('[AutoLogin] 💪 FORCING automatic form submission...');
    
    const form = document.querySelector('form');
    const submitBtn = document.querySelector('#loginbutton') || 
                     document.querySelector('input[type="submit"]') || 
                     document.querySelector('button[type="submit"]') ||
                     document.querySelector('button');

    if (form) {
      console.log('[AutoLogin] 🎯 Found form, submitting directly...');
      
      // Method 1: Direct form submission
      try {
        form.submit();
        console.log('[AutoLogin] ✅ Form submitted via form.submit()');
      } catch (error) {
        console.log('[AutoLogin] ⚠️ form.submit() failed:', error.message);
      }
      
      // Method 2: Trigger submit event
      setTimeout(() => {
        try {
          const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
          form.dispatchEvent(submitEvent);
          console.log('[AutoLogin] ✅ Submit event dispatched');
        } catch (error) {
          console.log('[AutoLogin] ⚠️ Submit event failed:', error.message);
        }
      }, 500);
    }

    if (submitBtn) {
      console.log('[AutoLogin] 🎯 Found submit button, clicking automatically...');
      
      // Method 3: Click the submit button
      setTimeout(() => {
        try {
          submitBtn.click();
          console.log('[AutoLogin] ✅ Submit button clicked automatically');
        } catch (error) {
          console.log('[AutoLogin] ⚠️ Button click failed:', error.message);
        }
      }, 1000);
      
      // Method 4: Trigger button events
      setTimeout(() => {
        try {
          const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
          submitBtn.dispatchEvent(clickEvent);
          console.log('[AutoLogin] ✅ Click event dispatched on submit button');
        } catch (error) {
          console.log('[AutoLogin] ⚠️ Click event failed:', error.message);
        }
      }, 1500);
    }
    
    // Method 5: Keyboard Enter as final fallback
    setTimeout(() => {
      attemptKeyboardSubmission();
    }, 2000);
    
    // Check for success after submission attempts
    setTimeout(() => {
      checkLoginSuccess();
    }, 3000);
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
      
      // Check for success - FIXED detection logic
      setTimeout(() => {
        checkLoginSuccess();
      }, 1500);
    } else {
      console.log('[AutoLogin] No submit element found for keyboard fallback');
    }
  }

  // FIXED: Enhanced login success detection
  function checkLoginSuccess() {
    console.log('[AutoLogin] 🔍 Checking for login success...');
    
    // Method 1: Check if we're redirected away from login page
    if (!window.location.href.includes('192.168.1.254:8090') && 
        !window.location.href.includes('login')) {
      console.log('[AutoLogin] ✅ Redirected away from login page - SUCCESS');
      notifySuccessAndClose();
      return;
    }
    
    // Method 2: Check if username field disappeared (common after successful login)
    if (!document.querySelector('#username') && 
        !document.querySelector('input[name="username"]') &&
        !document.querySelector('input[type="text"]')) {
      console.log('[AutoLogin] ✅ Login form disappeared - SUCCESS');
      notifySuccessAndClose();
      return;
    }
    
    // Method 3: Check for success text in page
    const pageText = document.body.innerText.toLowerCase();
    const successKeywords = ['success', 'successful', 'logged in', 'welcome', 'connected', 'authenticated'];
    if (successKeywords.some(keyword => pageText.includes(keyword))) {
      console.log('[AutoLogin] ✅ Success text found in page - SUCCESS');
      notifySuccessAndClose();
      return;
    }
    
    // Method 4: Check if page changed significantly (new content loaded)
    if (document.body.innerHTML.length < 1000 && !document.querySelector('form')) {
      console.log('[AutoLogin] ✅ Page structure changed - likely SUCCESS');
      notifySuccessAndClose();
      return;
    }
    
    console.log('[AutoLogin] 🔄 No clear success detected, will retry...');
    
    // If no success detected, try again after a short delay
    setTimeout(() => {
      checkLoginSuccess();
    }, 2000);
  }
  
  // FIXED: Notify success and close tab
  function notifySuccessAndClose() {
    console.log('[AutoLogin] 🎉 Login SUCCESS detected - notifying background script');
    
    // Mark as successful
    sessionStorage.setItem('autoLoginSuccess', 'true');
    
    // Notify background script to close this tab
    chrome.runtime.sendMessage({ action: 'loginSuccess' }).then(() => {
      console.log('[AutoLogin] 📨 Success message sent to background script');
    }).catch(error => {
      console.error('[AutoLogin] Failed to send success message:', error);
    });
    
    // Also try to close the tab directly as backup
    setTimeout(() => {
      console.log('[AutoLogin] 🚪 Attempting to close login tab...');
      try {
        window.close();
      } catch (error) {
        console.log('[AutoLogin] Could not close tab directly:', error.message);
      }
    }, 3000);
  }

})().catch(error => {
  console.error('[AutoLogin] Script error:', error);
});