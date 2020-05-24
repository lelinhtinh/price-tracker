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
            if (Object.keys(item).length < 3) return false;
            if (!item.url || !item.selector || !item.title) return false;

            return arr.findIndex((curr) => curr.url === item.url) === index;
        });
    } else {
        data = await getConfigs();
        if (Array.isArray(data) && data.length) data = data.filter((item) => item.url !== add.url);
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

chrome.storage.onChanged.addListener((changes) => {
    const newValue = changes.trackingList ? changes.trackingList.newValue || [] : [];
    taskFilter(newValue);
});

function getAllTasks() {
    return new Promise((resolve) => {
        chrome.alarms.getAll((tasks) => {
            resolve(tasks);
        });
    });
}

function createTask(item) {
    chrome.alarms.create(item.url, {
        delayInMinutes: 1,
        periodInMinutes: 1,
    });
}

function removeTask(task) {
    chrome.alarms.clear(task.name);
}

async function taskFilter(list) {
    let allTasks = await getAllTasks();
    list = list.filter((item) => !allTasks.includes(item.url));
    list.forEach(createTask);

    allTasks = await getAllTasks();
    list = await getConfigs();
    let unused = allTasks.filter((task) => list.find((item) => item.url === task.name));
    unused.forEach(removeTask);
}

async function fireTask(task) {
    const trackingList = await getConfigs();
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
        setConfigs(config);
        // eslint-disable-next-line no-empty
    } catch (error) {}
}

chrome.alarms.onAlarm.addListener((task) => {
    fireTask(task);
});
