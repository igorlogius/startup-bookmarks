/* global browser */

const manifest = browser.runtime.getManifest();
const extname = manifest.name;

async function getFromStorage(type, id, fallback) {
    let tmp = await browser.storage.local.get(id);
    return (typeof tmp[id] === type) ? tmp[id] : fallback;
}


function notify(title, message = "", iconUrl = "icon.png") {
    return browser.notifications.create(""+Date.now(),
        {
           "type": "basic"
            ,iconUrl
            ,title
            ,message
        }
    );
}


async function openStartupTabs(){

    const bmId = await getFromStorage('string', extname, undefined);
    if(!bmId){
        notify(extname,'No bookmark folder selected!\nPlease select a bookmark folder!');
        return;
    }
    const openInNewWindow= await getFromStorage('boolean', 'window', false);

    //let already_open_urls = new Set((await browser.tabs.query({})).filter( t => t.url ).map( t => t.url));

    try {
        const urls = new Set((await browser.bookmarks.getChildren(bmId))
                .filter( child => child.url) // ignore sub folders
                //.filter( child => !already_open_urls.has(child.url)) // ignore sub folders
                .map( child => child.url));

        if(openInNewWindow){
            const titlePreface = (await getFromStorage('string', 'titlePreface', extname)) + " : " ;

            browser.windows.create({
                url: [...urls],
                titlePreface
            });
        }else{
            let first = true;
            for(const url of urls) {
                browser.tabs.create({
                        'url': url,
                        'active': first
                        });
                first = false;
            }
        }
    }catch(e){
        notify(extname,'Bookmark folder removed!\nPlease select a new bookmark folder!');
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
	onclick: async function(info/*, tab*/) {
		if(info.bookmarkId ) {
			let tmp = await browser.storage.local.get(extname);
			if (tmp) {
				tmp = tmp[extname];
			}
			let blub = {};
			blub[extname] = (info.bookmarkId === tmp)? undefined: info.bookmarkId;
			browser.storage.local.set(blub);
            notify(extname,'Startup folder selected');
		}
	}
});

browser.menus.onShown.addListener(async function(info/*, tab*/) {
    const hideContextMenu = await getFromStorage('boolean', 'hideContextMenu', false);
    if(hideContextMenu){
		browser.menus.update(extname, {visible: false, checked: false});
    }else
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

browser.browserAction.onClicked.addListener(openStartupTabs);

