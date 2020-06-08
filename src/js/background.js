import * as utils from './utils.js';

chrome.browserAction.onClicked.addListener(() => {
    chrome.tabs.executeScript({
        file: 'src/js/vendor/dom-inspector.min.js',
    });
    chrome.tabs.executeScript({
        file: 'src/js/content.js',
    });
});

chrome.runtime.onMessage.addListener(async message => {
    if (message.action !== 'tracking-selector') return;
    await utils.setItem(message.data);
    utils.notify('ok', message.data.title, message.data.url);
});

chrome.storage.onChanged.addListener(changes => {
    const newValue = changes.trackingList ? changes.trackingList.newValue || [] : [];
    if (newValue.length) updateTask(newValue);
});

/**
 * @param {utils.Item[]} currList
 */
async function updateTask(currList) {
    let allTasks = await utils.getAllTasks();
    allTasks.forEach(task => {
        if (currList.findIndex(item => task.name === item.url) !== -1) utils.removeTask(task);
    });
    currList.forEach(utils.createTask);
}

chrome.alarms.onAlarm.addListener(utils.fireTask);

(async function () {
    let allTasks = await utils.getAllTasks();
    let allList = await utils.getAllList();

    if (!allTasks.length && !allList.length) return;
    if (allTasks.length && !allList.length) {
        await utils.cleanTask();
    }

    allList.forEach(utils.createTask);
})();
