//const temporary = browser.runtime.id.endsWith('@temporary-addon'); // debugging?
const manifest = browser.runtime.getManifest();
const extname = manifest.name;

async function openStartupTabs(){
	try {
		let tmp = await browser.storage.local.get(extname);
		if (!tmp) { return; }
		tmp = tmp[extname];
		if (!tmp) { return; }
		const urls = (await browser.bookmarks.getChildren(tmp))
			.filter( child => child.url) // ignore sub folders
			.map( child => child.url);
		let first = true;
		for(const url of urls) {
			browser.tabs.create({
				'url': url,
				'active': first
			});
			first = false;
		}
	}catch(e){
		console.error(e);
	}
}

browser.runtime.onStartup.addListener(openStartupTabs);

browser.menus.create({
	id: extname,
	title: 'Open at Startup', 
	type: "radio",
	contexts: ["bookmark"],
	visible: false,
	checked: false,
	onclick: async function(info, tab) {
		if(info.bookmarkId ) {
			//blub = { 'startup-tabs': info.bookmarkId }

			let tmp = await browser.storage.local.get(extname);
			if (tmp) {
				tmp = tmp[extname];
			}
			let blub = {};
			blub[extname] = (info.bookmarkId === tmp)? undefined: info.bookmarkId;
			browser.storage.local.set(blub);
		}
	}
});

browser.menus.onShown.addListener(async function(info, tab) {
	if(info.bookmarkId ) {
		const bmn = (await browser.bookmarks.get(info.bookmarkId))[0];
		if(!bmn.url) {
			let tmp = await browser.storage.local.get(extname);
			if (tmp) { tmp = tmp[extname]; }
			browser.menus.update(extname, {visible: true, checked: (tmp === info.bookmarkId)});
		}else{
			browser.menus.update(extname, {visible: false, checked: false});
		}
	}
	browser.menus.refresh();
});
