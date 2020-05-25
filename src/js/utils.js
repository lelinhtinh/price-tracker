/**
 * @param {'empty'|'ok'|'error'|'plus'|'minus'} status
 * @param {string} title
 * @param {string} message
 * @returns {void}
 */
export function notify(status, title, message) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL(`icons/${status}.png`),
        title: title,
        message: message,
    });
}

/**
 * @param {string} str
 * @returns {boolean}
 */
export function hasContent(str) {
    if (!(typeof str !== 'string')) return false;
    return str.trim() !== '';
}

/**
 * @typedef {object} History
 * @property {number} price
 * @property {double} time
 */

/**
 * @typedef {object} Item
 * @property {string} url
 * @property {string} selector
 * @property {string} title
 * @property {History[]} [history]
 */

/**
 * @typedef {object} Result
 * @property {Item[]} trackingList
 */

/**
 * @param {Item} item
 * @returns {Item|null}
 */
export async function verifyItem(item) {
    if (Object.keys(item).length !== (item.history ? 4 : 3)) return null;
    if (!hasContent(item.selector)) return null;
    if (!hasContent(item.title)) return null;
    if (item.history && !Array.isArray(item.history)) return null;
    return item;
}

/**
 * @param {Item[]} list
 * @returns {Item[]}
 */
export async function verifyList(list) {
    if (!Array.isArray(list)) {
        await cleanList();
        return [];
    }

    return list.filter((item, index, arr) => {
        if (!verifyItem(item)) return false;
        return arr.findIndex((curr) => curr.url === item.url) === index;
    });
}

/**
 * @returns {Item[]}
 */
export function getAllList() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['trackingList'], (result) => {
            resolve(result.trackingList ? result.trackingList : []);
        });
    });
}

/**
 * @param {Item} add
 * @param {boolean} [force] false
 * @returns {Item[]}
 */
export async function setItem(add, force = false) {
    let allList = force ? [] : await getAllList();
    add = await verifyItem(add);
    if (!add) return;

    if (allList.length) allList = allList.filter((item) => item.url !== add.url);
    allList.push(add);

    return new Promise((resolve) => {
        chrome.storage.local.set({ trackingList: allList }, () => {
            resolve(allList);
        });
    });
}

/**
 * @param {string} itemUrl
 * @returns {Item}
 */
export function getItem(itemUrl) {
    return new Promise((resolve) => {
        chrome.storage.local.get(
            ['trackingList'],
            /** @param {Result} result */
            (result) => {
                if (!result || !result.trackingList || !result.trackingList.length) resolve(null);
                resolve(result.trackingList.find((item) => item.url === itemUrl));
            }
        );
    });
}

/**
 * @param {string} itemUrl
 * @returns {Item}
 */
export function removeItem(itemUrl) {
    return new Promise((resolve) => {
        chrome.storage.local.get(
            ['trackingList'],
            /** @param {Result} result */
            (result) => {
                if (!result || !result.trackingList || !result.trackingList.length) resolve();
                const index = result.trackingList.findIndex((item) => item.url === itemUrl);
                if (index === -1) resolve();
                result.trackingList.splice(index, 1);
                resolve();
            }
        );
    });
}

/**
 * @returns {void}
 */
export function cleanList() {
    return new Promise((resolve) => {
        chrome.storage.local.remove(['trackingList'], () => {
            resolve();
        });
    });
}

/**
 * @typedef {object} Task
 * @property {string} name
 * @property {double} scheduledTime
 * @property {double} periodInMinutes
 */

/**
 * @returns {Task[]}
 */
export function getAllTasks() {
    return new Promise((resolve) => {
        chrome.alarms.getAll((tasks) => {
            resolve(tasks);
        });
    });
}

/**
 * @param {string} itemUrl
 * @returns {void}
 */
export function createTask(itemUrl) {
    chrome.alarms.create(itemUrl, {
        delayInMinutes: 0.1,
        periodInMinutes: 0.5,
    });
}

/**
 * @param {string} taskName
 * @returns {Task}
 */
export function getTask(taskName) {
    return new Promise((resolve) => {
        chrome.alarms.get(taskName, (task) => {
            resolve(task);
        });
    });
}

/**
 * @param {string} taskName
 * @returns {void}
 */
export function removeTask(taskName) {
    return new Promise((resolve) => {
        chrome.alarms.clear(taskName, () => {
            resolve();
        });
    });
}

/**
 * @returns {void}
 */
export function cleanTask() {
    return new Promise((resolve) => {
        chrome.alarms.clearAll(() => {
            resolve();
        });
    });
}
