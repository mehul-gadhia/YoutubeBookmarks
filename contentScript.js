let youtubeLeftControls, youtubePlayer;
let currentVideo = "";
let currentVideoBookmarks = [];

const fetchBookmarks = (callback) => {
  chrome.storage.sync.get(['bookmarks'], (obj) => {
    const bookmarks = obj['bookmarks'] ? JSON.parse(obj['bookmarks']) : [];
    callback(bookmarks);
  });
};

const addNewBookmarkEventHandler = () => {
  const currentTime = youtubePlayer.currentTime;
  const videoTitle = document.getElementsByClassName("style-scope ytd-watch-metadata").title.innerText
  const formatttedTitle = videoTitle.length > 50 ? videoTitle.slice(0, 40).trim() + '...' : videoTitle.trim()
  const url = `https://www.youtube.com/watch?v=${currentVideo}&t=${currentTime}s`

  const newBookmark = {
    time: currentTime,
    timeStamp: `[${getTime(currentTime)}]`,
    desc: formatttedTitle,
    url: url
  };

  const duplicates = currentVideoBookmarks.filter((b) => b.time === newBookmark.time && b.url === newBookmark.url);
  console.log("currentVideoBookmarks: "+currentVideoBookmarks)
  console.log("duplicates: "+duplicates)
  if (duplicates.length === 0) {
    fetchBookmarks((bookmarks) => {
      currentVideoBookmarks.push(newBookmark)
      chrome.storage.sync.set({
        ['bookmarks']: JSON.stringify([...bookmarks, newBookmark].sort((a, b) => a.time - b.time))
      });
    });
  }
};
const newVideoLoaded = (activated = false, timeStamp = null) => {
  youtubeLeftControls = document.getElementsByClassName("ytp-right-controls")[0];
  youtubePlayer = document.getElementsByClassName('video-stream')[0];

  fetchBookmarks((bookmarks) => {
    currentVideoBookmarks = bookmarks.filter(item => item.url.includes(currentVideo));
    if (currentVideoBookmarks !== [] && !activated && timeStamp === null) {
      youtubePlayer.currentTime = currentVideoBookmarks[currentVideoBookmarks.length-1].time
    }
  });

  const bookmarkBtnExists = document.querySelector(".bookmark-btn");

  if (!bookmarkBtnExists) {
    const bookmarkBtn = document.createElement("img");

    bookmarkBtn.src = chrome.runtime.getURL("assets/bookmark.png");
    bookmarkBtn.className = "ytp-button bookmark-btn";
    bookmarkBtn.title = "Click to bookmark current timestamp";

    if (youtubeLeftControls) {
      youtubeLeftControls.appendChild(bookmarkBtn);
    }

    bookmarkBtn.addEventListener("click", addNewBookmarkEventHandler);
  }
};

const handleMessage = (obj, sendResponse) => {
  const { type, value, videoId, timeStamp, activated } = obj;
  console.log("TIMESTAMP: "+timeStamp)

  if (type === "NEW") {
    currentVideo = videoId;
    newVideoLoaded(activated, timeStamp);
  } else if (type === "PLAY") {
    console.log("PLAY MESSAGE")
    youtubePlayer.currentTime = value;
  }
  sendResponse({status: 'ok'}); // send back a response
};

// Here, chrome.runtime.onMessage is used to listen for messages sent from extension pages (e.g., popup or options page)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sendResponse);
  return true;  // this will keep the message channel open until `sendResponse` is called
});

const getTime = t => {
  var date = new Date(0);
  date.setSeconds(t);
  return date.toISOString().substr(11, 8);
};
