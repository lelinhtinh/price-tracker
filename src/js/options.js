import * as utils from './utils.js';

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
            await utils.cleanList();
        } else {
            try {
                data = JSON.parse(data);
                // eslint-disable-next-line no-empty
            } catch (error) {}

            if (!Array.isArray(data)) return;
            await utils.setItem(data, true);
        }

        updated();
    });

    chrome.storage.onChanged.addListener((changes) => {
        const newValue = changes.trackingList ? changes.trackingList.newValue || [] : [];
        $listConfigs.value = JSON.stringify(newValue);
    });

    const currentConfigs = await utils.getAllList();
    $listConfigs.value = JSON.stringify(currentConfigs);
})();
