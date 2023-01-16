/* global browser */

const folders = document.getElementById('folder');
const testbtn = document.getElementById('test');

async function getFromStorage(type, id, fallback) {
    let tmp = await browser.storage.local.get(id);
    return (typeof tmp[id] === type) ? tmp[id] : fallback;
}

async function setToStorage(id, value) {
    let obj = {};
    obj[id] = value
    return browser.storage.local.set(obj);
}


function onChange(evt) {

	let id = evt.target.id;
	let el = document.getElementById(id);

	let value = ( (el.type === 'checkbox') ? el.checked : el.value)
	let obj = {}

	if(el.type === 'number'){
		try {
			value = parseInt(value);
			if(isNaN(value)){
				value = el.min;
			}
			if(value < el.min) {
				value = el.min;
			}
		}catch(e){
			value = el.min
		}
	}

	obj[id] = value;

	browser.storage.local.set(obj).catch(console.error);

}

[  "folder", "window", "titlePreface" ].map( (id) => {

	browser.storage.local.get(id).then( (obj) => {

		let el = document.getElementById(id);
		let val = obj[id];

        console.log(id,val);

		if(typeof val !== 'undefined') {
			if(el.type === 'checkbox') {
				el.checked = val;
			}
			else{
				el.value = val;
			}
		}

	}).catch(console.error);

	let el = document.getElementById(id);
	el.addEventListener('input', onChange);
});


function recGetFolders(node, depth = 0){
    let out = new Map();
    if(typeof node.url !== 'string'){
        if(node.id !== 'root________'){
            out.set(node.id, { 'depth': depth, 'title': node.title });
        }
        if(node.children){
            for(let child of node.children){
                out = new Map([...out, ...recGetFolders(child, depth+1) ]);
            }
        }
    }
    return out;
}

async function initSelect() {
    const nodes = await browser.bookmarks.getTree();
    let out = new Map();
    let depth = 1;
    for(const node of nodes){
        out = new Map([...out, ...recGetFolders(node, depth) ]);
    }
    let tmp = await getFromStorage('string','folder','')
    let last_val = '';
    for(const [k,v] of out){
        //console.debug(k, v.title);
        folders.add(new Option("-".repeat(v.depth) + " " + v.title, k))
        if(k === tmp){
            last_val = k;
        }
    }
    folders.value = last_val;
}

async function onLoad() {

    await initSelect();

        if(folders.value !== ''){
            testbtn.disabled = false;
        }else{
            testbtn.disabled = true;
        }


    folders.addEventListener('input', function () {
        if(folders.value !== ''){
            testbtn.disabled = false;
        }else{
            testbtn.disabled = true;
        }
    });
    testbtn.addEventListener('click', function () {
        // send msg to background script
        browser.runtime.sendMessage({ cmd: "testStartupTabs" })
    });

}

document.addEventListener('DOMContentLoaded', onLoad);

