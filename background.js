/* global browser */

const manifest = browser.runtime.getManifest();
const extname = manifest.name;

async function getFromStorage(type, id, fallback) {
	let tmp = await browser.storage.local.get(id);
	return (typeof tmp[id] === type) ? tmp[id] : fallback;
}

async function setToStorage(id, value) {
	let obj = {};
	obj[id] = value
	return browser.storage.local.set(obj);
}

async function openStartupTabs(){

	let tmp;
	const bmId = await getFromStorage('string', 'folder', '');
	if(bmId === ''){
		return;
	}

	const urls = new Set((await browser.bookmarks.getChildren(bmId))
		.filter( child => child.url) // ignore sub folders
		.map( child => child.url));

	if(urls.size < 1) {
		return;
	}

	const openInNewWindow = await getFromStorage('boolean', 'window', true);

	if(openInNewWindow){
		const titlePreface = (await getFromStorage('string', 'titlePreface', extname)) + " : " ;
		tmp = await browser.windows.create({ titlePreface });
	}else{
		tmp = (await browser.windows.getCurrent({ populate: false }));
	}
	const winId = tmp.id;

	const createdTabIds = new Set();

	let first = true;
	for(const url of urls) {
		tmp = await browser.tabs.create({
			'windowId': winId,
			'pinned': url.endsWith('#pin'),
			'url': url,
			'active': first
		});
		first = false;
		createdTabIds.add(tmp.id);
	}
	// remove the inital about:newtab and everything else not part of the startup tabs
	const itabIds = (await browser.tabs.query({windowId: winId})).filter(t => !createdTabIds.has(t.id)).map(t => t.id);
	browser.tabs.remove(itabIds);
}

browser.runtime.onStartup.addListener(openStartupTabs);

browser.runtime.onMessage.addListener( (req /*,sender, sendRes*/) => {
        if(req.cmd === 'testStartupTabs') {
            openStartupTabs();
        }
});

