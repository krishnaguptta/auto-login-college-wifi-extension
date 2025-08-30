(async () => {
  if (document.readyState === 'loading') {
    await new Promise((res) => document.addEventListener('DOMContentLoaded', res, { once: true }));
  }

  const settings = await chrome.storage.local.get({ username: '', password: '', autoSubmit: true });
  if (!settings.username || !settings.password) return;

  // Hard-coded selectors for your portal
  const userEl = document.querySelector('#username') || document.querySelector('[name="username"]');
  const passEl = document.querySelector('#password') || document.querySelector('[name="password"]');
  const submitEl = document.querySelector('input[type="submit"]');

  if (!userEl || !passEl) return;

  userEl.value = settings.username;
  userEl.dispatchEvent(new Event('input', { bubbles: true }));

  passEl.value = settings.password;
  passEl.dispatchEvent(new Event('input', { bubbles: true }));

  if (settings.autoSubmit && submitEl) {
    submitEl.click();
  }
})();