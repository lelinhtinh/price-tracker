import * as utils from './utils.js';

document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = chrome.i18n.getMessage(el.textContent.trim());
});

const $themeSwitch = document.querySelector('#themeSwitch');
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.classList.add('dark');
    $themeSwitch.innerHTML = '🌙';
}
$themeSwitch.addEventListener('click', e => {
    e.preventDefault();
    const el = e.target;

    const bodyClass = document.body.classList;
    bodyClass.contains('dark')
        ? ((el.innerHTML = '☀️'), bodyClass.remove('dark'))
        : ((el.innerHTML = '🌙'), bodyClass.add('dark'));
});

document.addEventListener('click', e => {
    if (e.target.classList.contains('delete-item')) {
        utils.removeItem({
            url: e.target.dataset.url,
        });
        utils.removeTask({
            name: e.target.dataset.url,
        });
        e.target.closest('.row').remove();
    } else if (e.target.classList.contains('refresh-item')) {
        utils.fireTask({
            name: e.target.dataset.url,
            scheduledTime: new Date().getTime(),
        });
    }
});

const icons = {
    refresh:
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-refresh-ccw"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>',
    delete:
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-x"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    up:
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-up"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>',
    down:
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-down"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>',
};
const $trackingList = document.querySelector('#trackingList');

/**
 * @param {utils.Item[]} list
 */
function renderTrackingList(list) {
    if (!list || !list.length) {
        $trackingList.innerHTML = '';
        return;
    }

    list.forEach(item => {
        let history = item.history || [];

        let lastPrice;
        let htmlHistory = '<div class="row">';
        history.forEach(curr => {
            if (!lastPrice) lastPrice = curr.price;

            let mount = 'text-grey">';
            if (curr.price < lastPrice) {
                mount = `text-error">${icons.down}`;
            } else if (curr.price > lastPrice) {
                mount = `text-success">${icons.up}`;
            }
            htmlHistory += `<small aria-label="${utils.dt(curr.time)}" class="col-3 hint--left ${mount} ${utils.vnd(
                curr.price
            )}</small>`;
        });
        htmlHistory += '</div>';

        const htmlItem = `
            <div class="row" data-url="${item.url}">
                <div class="col">
                    <h5>
                        <a href="${item.url}" target="_blank" class="text-dark">${item.title}</a>
                    </h5>
                    ${htmlHistory}
                </div>
                <div class="col-1">
                    <button class="button success icon-only refresh-item" data-url="${item.url}">
                        ${icons.refresh}
                    </button>
                </div>
                <div class="col-1">
                    <button class="button error icon-only delete-item" data-url="${item.url}">
                        ${icons.delete}
                    </button>
                </div>
            </div>
        `;

        const $foundItem = document.querySelector(`.row[data-url="${item.url}"]`);
        if ($foundItem === null) {
            $trackingList.insertAdjacentHTML('beforeend', htmlItem);
        } else {
            $foundItem.insertAdjacentHTML('afterend', htmlItem);
            $foundItem.remove();
        }
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

    $formConfigs.addEventListener('submit', async e => {
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
            await utils.setList(data);
        }

        updated();
    });

    chrome.storage.onChanged.addListener(async changes => {
        if (!changes.trackingList) return;

        let newValue = changes.trackingList.newValue || [];
        const oldValue = changes.trackingList.oldValue || [];
        if (!newValue.length && oldValue.length > newValue) newValue = await utils.getAllList();

        $listConfigs.value = JSON.stringify(newValue);
        renderTrackingList(newValue);
    });

    const currentConfigs = await utils.getAllList();
    $listConfigs.value = JSON.stringify(currentConfigs);
    renderTrackingList(currentConfigs);
})();
