const TASK_DELAY = 1;

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
    if (typeof str !== 'string') return false;
    return str.trim() !== '';
}

/**
 * @param {array|object} obj
 * @returns {void}
 */
export function log(obj, name = null) {
    if (typeof obj !== 'object') console.log(Object.create(obj), name ? name : typeof obj);
    console.log(Object.create(obj), name ? name : 'object');
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
export function verifyItem(item) {
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
        return arr.findIndex(curr => curr.url === item.url) === index;
    });
}

/**
 * @returns {Item[]}
 */
export function getAllList() {
    return new Promise(resolve => {
        chrome.storage.local.get(['trackingList'], result => {
            resolve(result.trackingList ? result.trackingList : []);
        });
    });
}

/**
 * @param {Item[]} data
 * @returns {Item[]}
 */
export function setList(data) {
    return new Promise(resolve => {
        chrome.storage.local.set({ trackingList: data }, () => {
            resolve(data);
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
    add = verifyItem(add);
    if (!add) return;

    if (allList.length) allList = allList.filter(item => item.url !== add.url);
    allList.push(add);

    return await setList(allList);
}

/**
 * @param {Item} item
 * @returns {Item}
 */
export function getItem(item) {
    return new Promise(resolve => {
        chrome.storage.local.get(
            ['trackingList'],
            /** @param {Result} result */
            result => {
                if (!result || !result.trackingList || !result.trackingList.length) resolve(null);
                resolve(result.trackingList.find(temp => temp.url === item.url));
            }
        );
    });
}

/**
 * @param {Item} item
 * @returns {Item}
 */
export function removeItem(item) {
    return new Promise(resolve => {
        chrome.storage.local.get(
            ['trackingList'],
            /** @param {Result} result */
            async result => {
                if (!result || !result.trackingList || !result.trackingList.length) resolve();

                const index = result.trackingList.findIndex(temp => temp.url === item.url);
                if (index === -1) resolve();

                result.trackingList.splice(index, 1);
                resolve(await setList(result.trackingList));
            }
        );
    });
}

/**
 * @returns {void}
 */
export function cleanList() {
    return new Promise(resolve => {
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
    return new Promise(resolve => {
        chrome.alarms.getAll(tasks => {
            resolve(tasks);
        });
    });
}

/**
 * @param {Item} item
 * @returns {void}
 */
export function createTask(item) {
    chrome.alarms.create(item.url, {
        delayInMinutes: TASK_DELAY,
        periodInMinutes: TASK_DELAY,
    });
}

/**
 * @param {Task} task
 * @returns {Task}
 */
export function getTask(task) {
    return new Promise(resolve => {
        chrome.alarms.get(task.name, task => {
            resolve(task);
        });
    });
}

/**
 * @param {Task} task
 * @returns {void}
 */
export function removeTask(task) {
    return new Promise(resolve => {
        chrome.alarms.clear(task.name, () => {
            resolve();
        });
    });
}

/**
 * @returns {void}
 */
export function cleanTask() {
    return new Promise(resolve => {
        chrome.alarms.clearAll(() => {
            resolve();
        });
    });
}

/**
 * @param {Task} task
 */
export async function fireTask(task) {
    const trackingList = await getAllList();
    const config = trackingList.find(item => item.url === task.name);

    try {
        let res = await fetch(config.url);
        res = await res.text();
        const doc = new DOMParser().parseFromString(res, 'text/html');

        let price = doc.querySelector(config.selector);
        if (price === null) return;

        price = price.textContent.trim();
        price = price.replace(/\D/g, '');

        let history = config.history || [];
        const lastPrice = history[history.length - 1];

        if (!lastPrice || lastPrice.price !== price)
            history.push({
                price: price,
                time: task.scheduledTime,
            });

        if (history.length > 4) history = history.slice(history.length - 4);

        config.history = history;
        await setItem(config);
        // eslint-disable-next-line no-empty
    } catch (error) {}
}

/**
 * @param {number} price
 */
export function vnd(price) {
    return Number(price).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
}

/**
 * @param {number} timestamp
 */
export function dt(timestamp) {
    return new Date(Number(timestamp)).toLocaleString();
}
