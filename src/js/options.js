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

(async function () {
    const $formConfigs = document.querySelector('#formConfigs');
    const $listConfigs = document.querySelector('#listConfigs');
    const $statusWrap = document.querySelector('#statusWrap');

    function updated() {
        $statusWrap.classList.remove('is-hidden');
        setTimeout(() => {
            $statusWrap.classList.add('is-hidden');
        }, 3000);
    }

    $formConfigs.addEventListener('submit', async (e) => {
        e.preventDefault();

        let data = $listConfigs.value.trim();
        if (data === '') {
            await removeConfigs();
        } else {
            try {
                data = JSON.parse(data);
                // eslint-disable-next-line no-empty
            } catch (error) {}

            if (!Array.isArray(data)) return;
            await setConfigs(data, true);
        }

        updated();
    });

    chrome.storage.onChanged.addListener((changes) => {
        const newValue = changes.trackingList ? changes.trackingList.newValue || [] : [];
        $listConfigs.value = JSON.stringify(newValue);
    });

    const currentConfigs = await getConfigs();
    $listConfigs.value = JSON.stringify(currentConfigs);
})();
