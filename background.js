const sendMessageToContentScript = (tabId, url, activated = false) => {
  if (url && url.includes("youtube.com/watch")) {
    const queryParameters = url.split("?")[1];
    const urlParameters = new URLSearchParams(queryParameters);

    chrome.tabs.sendMessage(tabId, {
      type: "NEW",
      videoId: urlParameters.get("v"),
      timeStamp: urlParameters.get("t"),
      activated: activated,
    }, function(response) {
      if (chrome.runtime.lastError) {
        console.log(`Error: ${chrome.runtime.lastError.message}`);
      } else {
        console.log(`Received response: ${response}`);
      }
    });
  }
};

// Upon chrome tab update
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    console.log("ON UPDATED")
    sendMessageToContentScript(tabId, tab.url);
  }
});

// Upon clicking onto tab
chrome.tabs.onActivated.addListener((activeInfo) => {
  console.log("ON ACTIVATED")
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    sendMessageToContentScript(activeInfo.tabId, tab.url, true);
  });
});
