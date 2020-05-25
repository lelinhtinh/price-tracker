import * as utils from './utils.js';

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
    await utils.setItem(message.data);
    utils.notify('ok', message.data.title, message.data.url);
});

chrome.storage.onChanged.addListener((changes) => {
    const newValue = changes.trackingList ? changes.trackingList.newValue || [] : [];
    if(newValue.length) taskFilter(newValue);
});

/**
 *
 * @param {utils.Item[]} currList
 */
async function taskFilter(currList) {
    let allTasks = await utils.getAllTasks();
    allTasks = allTasks.filter((task) => currList.findIndex(item => task.name === item.url) === -1);
    list.forEach(utils.createTask);

    allTasks = await utils.getAllTasks();
    list = await utils.getAllList();
    let unused = allTasks.filter((task) => list.find((item) => item.url === task.name));
    unused.forEach(utils.removeTask);
}

async function fireTask(task) {
    const trackingList = await utils.getAllList();
    const config = trackingList.find((item) => item.url === task.name);

    try {
        let res = await fetch(config.url);
        res = await res.text();
        const doc = new DOMParser().parseFromString(res, 'text/html');

        let price = doc.querySelector(config.selector);
        if (price === null) return;

        price = price.textContent.trim();
        price = price.replace(/\D/g, '');

        console.log(price);
        let history = config.history || [];
        history.push({
            price: price,
            time: task.scheduledTime,
        });

        config.history = history;
        utils.setItem(config);
        // eslint-disable-next-line no-empty
    } catch (error) {}
}

chrome.alarms.onAlarm.addListener((task) => {
    fireTask(task);
});

function appendTask() {

}

(async function () {
    let allTasks = await utils.getAllTasks();
    let allList = await utils.getAllList();

    if (!allTasks.length && !allList.length) return;
    if (allTasks.length && !allList.length) {
        await utils.removeTask
    }
    console.log(allTasks, list);
})();
