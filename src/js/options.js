let settings = [];

function initSettings(key, val) {
    document.querySelector('#' + key).value = val;
    settings[key] = val;
}

chrome.storage.onChanged.addListener(changes => {
    for (let key in changes) {
        initSettings(key, changes[key].newValue);
    }
});

chrome.storage.sync.get(items => {
    for (const key in items) {
        initSettings(key, items[key]);
    }
});
