// background.js
async function tryInject(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab || !tab.url || !/^https?:\/\//i.test(tab.url)) return;
    await chrome.scripting.executeScript({ target: { tabId }, files: ['autologin.js'] });
  } catch (e) {
    // ignore
  }
}

chrome.webNavigation.onCompleted.addListener((details) => {
  if (details.frameId === 0) tryInject(details.tabId);
});

chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId === 0) tryInject(details.tabId);
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('poke', { periodInMinutes: 2 });
});

chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create('poke', { periodInMinutes: 2 });
});

chrome.alarms.onAlarm.addListener(async () => {
  const tabs = await chrome.tabs.query({});
  for (const t of tabs) tryInject(t.id);
});