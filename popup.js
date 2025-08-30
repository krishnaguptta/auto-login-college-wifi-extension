document.getElementById("save").addEventListener("click", async () => {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const autoSubmit = document.getElementById("autoSubmit").checked;

  await chrome.storage.local.set({ username, password, autoSubmit });

  document.getElementById("status").textContent = "Saved!";
  setTimeout(() => {
    document.getElementById("status").textContent = "";
  }, 2000);
});

// Load saved values when popup opens
(async () => {
  const settings = await chrome.storage.local.get({ username: "", password: "", autoSubmit: true });
  document.getElementById("username").value = settings.username;
  document.getElementById("password").value = settings.password;
  document.getElementById("autoSubmit").checked = settings.autoSubmit;
})();
