function notify(status, title, message) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL(`icons/${status}.png`),
        title: title,
        message: message,
    });
}

function getConfigs() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['trackingList'], (result) => {
            resolve(result.trackingList ? result.trackingList : []);
        });
    });
}

async function setConfigs(add, force = false) {
    let data;

    if (force) {
        data = add.filter((item, index, arr) => {
            if (Object.keys(item).length !== 3) return false;
            if (!item.url || item.selector || item.title) return false;

            return arr.findIndex((curr) => curr.url === item.url) === index;
        });
    } else {
        data = await getConfigs();
        if (data.length) data = data.filter((item) => item.url !== add.url);
        data.push(add);
    }

    return new Promise((resolve) => {
        chrome.storage.local.set({ trackingList: data }, () => {
            resolve(data);
        });
    });
}

function removeConfigs() {
    return new Promise((resolve) => {
        chrome.storage.local.remove(['trackingList'], () => {
            resolve();
        });
    });
}

let matchUrls = ['https://github.com/lelinhtinh/*'];

chrome.webRequest.onBeforeSendHeaders.addListener(
    (info) => {
        const headers = info.requestHeaders;
        headers.forEach((header) => {
            if (header.name.toLowerCase() == 'user-agent') {
                header.value =
                    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Safari/537.36';
            }
        });
        return { requestHeaders: headers };
    },
    {
        urls: matchUrls,
        types: ['main_frame', 'sub_frame', 'xmlhttprequest'],
    },
    ['blocking', 'requestHeaders']
);

chrome.browserAction.onClicked.addListener(() => {
    chrome.tabs.executeScript({
        file: 'src/js/vendor/dom-inspector.min.js',
    });
    chrome.tabs.executeScript({
        file: 'src/js/content.js',
    });
});

chrome.runtime.onMessage.addListener(async (message) => {
    if (message.action !== 'tracking-selector') return;
    await setConfigs(message.data);
    notify('ok', message.data.title, message.data.url);
});
