/* global browser */

const manifest = browser.runtime.getManifest();
const extname = manifest.name;

async function getFromStorage(type, id, fallback) {
  let tmp = await browser.storage.local.get(id);
  return typeof tmp[id] === type ? tmp[id] : fallback;
}

async function openStartupTabs() {
  let tmp;
  const bmId = await getFromStorage("string", "folder", "");
  if (bmId === "") {
    return;
  }

  const urls = new Set(
    (await browser.bookmarks.getChildren(bmId))
      .filter((child) => child.url) // ignore sub folders
      .map((child) => child.url)
  );

  if (urls.size < 1) {
    return;
  }

  let already_open_urls = new Set();

  const openInNewWindow = await getFromStorage("boolean", "window", false);

  if (openInNewWindow) {
    const titlePreface =
      (await getFromStorage("string", "titlePreface", extname)) + " : ";
    tmp = await browser.windows.create({ titlePreface });
  } else {
    tmp = await browser.windows.getCurrent({ populate: false });
    already_open_urls = new Set(
      (await browser.tabs.query({})).map((t) => t.url)
    );
  }
  //console.debug(already_open_urls);
  const winId = tmp.id;

  const createdTabIds = new Set();

  let first = true;
  for (const url of urls) {
    if (!already_open_urls.has(url.split("#pin")[0])) {
      //console.debug(url, " not in ", already_open_urls);
      tmp = await browser.tabs.create({
        windowId: winId,
        pinned: url.endsWith("#pin"),
        url: url.split("#pin")[0],
        active: first,
      });
      first = false;
      createdTabIds.add(tmp.id);
    }
  }
  // remove  none http
  const itabIds = (await browser.tabs.query({ windowId: winId }))
    .filter((t) => !(/^https?:/.test(t.url) || createdTabIds.has(t.id)))
    .map((t) => t.id);
  browser.tabs.remove(itabIds);
}

browser.runtime.onStartup.addListener(openStartupTabs);

browser.runtime.onMessage.addListener((req /*,sender, sendRes*/) => {
  if (req.cmd === "testStartupTabs") {
    openStartupTabs();
  }
});
