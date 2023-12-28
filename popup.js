import { getActiveTabURL } from "./utils.js";

let currentVideoURL = '';
let container = '';
let main = '';
let body = '';
let rectangle = '';

const fetchBookmarks = (callback) => {
  chrome.storage.sync.get(['bookmarks'], (obj) => {
    const bookmarks = obj['bookmarks'] ? JSON.parse(obj['bookmarks']) : [];
    callback(bookmarks);
  });
};

const addNewBookmark = (bookmarks, bookmark) => {
  const bookmarkTitleElement = document.createElement("div");
  const controlsElement = document.createElement("div");
  const newBookmarkElement = document.createElement("div");
  const bookmarkTimeElement = document.createElement("div");

  bookmarkTitleElement.textContent = bookmark.desc;
  bookmarkTitleElement.className = "bookmark-title";
  bookmarkTitleElement.addEventListener("click", onPlay)
  controlsElement.className = "bookmark-controls";
  bookmarkTimeElement.textContent= bookmark.timeStamp;
  bookmarkTimeElement.className = "bookmark-time";
  bookmarkTimeElement.addEventListener("click", onPlay)

  // setBookmarkAttributes("play", onPlay, controlsElement);
  setBookmarkAttributes("delete", onDelete, controlsElement);

  newBookmarkElement.id = "bookmark-" + bookmark.time;
  newBookmarkElement.className = "bookmark";
  newBookmarkElement.setAttribute("timestamp", bookmark.time);
  newBookmarkElement.setAttribute("url", bookmark.url);

  newBookmarkElement.appendChild(bookmarkTitleElement);
  newBookmarkElement.appendChild(bookmarkTimeElement);
  newBookmarkElement.appendChild(controlsElement);
  // newBookmarkElement.addEventListener("click", onPlay)
  bookmarks.appendChild(newBookmarkElement);
};

const viewBookmarks = (currentBookmarks=[]) => {
  const bookmarksElement = document.getElementById("bookmarks");
  bookmarksElement.innerHTML = "";

  if (currentBookmarks.length > 0) {
    for (let i = 0; i < currentBookmarks.length; i++) {
      const bookmark = currentBookmarks[i];
      addNewBookmark(bookmarksElement, bookmark);
      updateHeights()
    }
  } else {
    bookmarksElement.innerHTML = `<i class="row">You don't have any bookmarks.</i>`;
  }

  return;
};

const onPlay = async e => {
  const bookmarkTime = e.target.parentNode.getAttribute("timestamp");
  const bookmarkUrl = e.target.parentNode.getAttribute("url");
  const activeTab = await getActiveTabURL();
  console.log('activeTab: ' + activeTab.url)

  if (currentVideoURL !== '') {
    chrome.tabs.sendMessage(activeTab.id, {
      type: "PLAY",
      value: bookmarkTime,
    });
  } else {
    chrome.tabs.update(activeTab.id, {url: bookmarkUrl})
  }
};


const onDelete = async e => {
  const bookmarkUrl = e.target.parentNode.parentNode.getAttribute("url");
  const bookmarkTime = e.target.parentNode.parentNode.getAttribute("timestamp");

  const bookmarkElementToDelete = document.getElementById(
    "bookmark-" + bookmarkTime
  );
  bookmarkElementToDelete.parentNode.removeChild(bookmarkElementToDelete);

  fetchBookmarks((bookmarks)=> {
    const updatedBookmarks = bookmarks.filter((b) => b.time !== bookmarkTime && b.url !== bookmarkUrl);
    chrome.storage.sync.set({ ['bookmarks']: JSON.stringify(updatedBookmarks) });
    if (updatedBookmarks.length > 0) {
      updateHeights()
    } else {
      const bookmarksElement = document.getElementById("bookmarks");
      bookmarksElement.innerHTML = `<i class="row">You don't have any bookmarks.</i>`;
      updateHeights()
    }
    
  })
};

const setBookmarkAttributes =  (src, eventListener, controlParentElement) => {
  const controlElement = document.createElement("img");

  controlElement.src = "assets/" + src + ".png";
  controlElement.title = src;
  controlElement.addEventListener("click", eventListener);
  controlParentElement.appendChild(controlElement);
};

function updateHeights() {
  const numBookmarks = document.querySelectorAll(".bookmark").length;
  const newHeight = numBookmarks > 0? 74 + numBookmarks * 46: 120; // Adjust the height increment as needed

  main.style.minHeight = newHeight + "px";
  rectangle.style.height = newHeight + "px";
  container.style.minHeight = newHeight + "px";
  document.body.style.height = newHeight + "px";
}

document.addEventListener("DOMContentLoaded", async () => {
  container = document.querySelector(".container");
  main = container.querySelector(".main");
  rectangle = container.querySelector(".rectangle");

  const activeTab = await getActiveTabURL();
  const queryParameters = activeTab.url.split("?")[1];
  const urlParameters = new URLSearchParams(queryParameters);

  const currentVideo = urlParameters.get("v");

  if (activeTab.url.includes("youtube.com/watch") && currentVideo) {
    currentVideoURL = activeTab.url
    chrome.storage.sync.get(['bookmarks'], (data) => {
      const allBookmarks = data['bookmarks'] ? JSON.parse(data['bookmarks']) : [];
      const currentVideoBookmarks = allBookmarks.filter(item => item.url.includes(currentVideo))
      viewBookmarks(currentVideoBookmarks);
    });
  } else {
    fetchBookmarks(viewBookmarks)
  }
});

