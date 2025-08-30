(async () => {
  const els = {
    username: document.getElementById('username'),
    password: document.getElementById('password'),
    autoSubmit: document.getElementById('autoSubmit'),
    save: document.getElementById('save'),
    status: document.getElementById('status')
  };

  const saved = await chrome.storage.local.get({ username: '', password: '', autoSubmit: true });
  els.username.value = saved.username;
  els.password.value = saved.password;
  els.autoSubmit.checked = saved.autoSubmit;

  els.save.addEventListener('click', async () => {
    await chrome.storage.local.set({
      username: els.username.value.trim(),
      password: els.password.value,
      autoSubmit: els.autoSubmit.checked
    });
    els.status.textContent = 'Saved!';
    setTimeout(() => els.status.textContent = '', 1500);
  });
})();