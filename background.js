async function openStartupTabs(){
	const res = await browser.storage.local.get('startup-tabs');
	if ( Array.isArray(res['startup-tabs']) ){
		for(const obj of res['startup-tabs']) {
			browser.tabs.create({
				'url': obj.url,
				'active': false
			});
		}
	}
}

browser.runtime.onStartup.addListener(openStartupTabs);
browser.browserAction.onClicked.addListener(openStartupTabs);
