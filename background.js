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
    const bmId = await getFromStorage('string', 'folder', undefined);
    if(!bmId){
        return;
    }
    const openInNewWindow= await getFromStorage('boolean', 'window', false);

    //let already_open_urls = new Set((await browser.tabs.query({})).filter( t => t.url ).map( t => t.url));

    //try {
        const urls = new Set((await browser.bookmarks.getChildren(bmId))
                .filter( child => child.url) // ignore sub folders
                //.filter( child => !already_open_urls.has(child.url)) // ignore sub folders
                .map( child => child.url));

        if(urls.size< 1) {
            return;
        }
        if(openInNewWindow){
            const titlePreface = (await getFromStorage('string', 'titlePreface', extname)) + " : " ;

            const win = await browser.windows.create({
                titlePreface
            });

	    const createdTabIds = new Set();

            let first = true;
            for(const url of urls) {
                tmp = await browser.tabs.create({
			'windowId': win.id,
			'pinned': url.endsWith('#pin'),
                        'url': url,
                        'active': first
                        });
                first = false;
		createdTabIds.add(tmp.id);
            }
	    // remove the inital about:newtab and everything else not part of the startup tabs
	    const itabIds = (await browser.tabs.query({windowId: win.id})).filter(t => !createdTabIds.has(t.id)).map(t => t.id);
	    browser.tabs.remove(itabIds);
        }else{
            let first = true;
            for(const url of urls) {
                browser.tabs.create({
			'pinned': url.endsWith('#pin'),
                        'url': url,
                        'active': first
                        });
                first = false;
            }
        }
    /*}catch(e){
        console.error(e);
    }*/
}

browser.runtime.onStartup.addListener(openStartupTabs);

/*
browser.browserAction.onClicked.addListener( () => {
    browser.windows.create({
        url: ["dialog.html"],
        type: "popup",
        width: 300,
        height: 250
    });
});
*/

browser.runtime.onMessage.addListener( (req /*,sender, sendRes*/) => {
        if(req.cmd === 'testStartupTabs') {
            openStartupTabs();
        }
});

async function onInstalled(details) {
    if(details.reason === 'update') {
        let tmp = await getFromStorage('string',extname, '');
        if(tmp !== ''){
            setToStorage('folder',tmp);
        }
    }
}

browser.runtime.onInstalled.addListener(onInstalled);

