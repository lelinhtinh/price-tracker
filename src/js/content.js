/* global DomInspector */

(function () {
    const inspector = new DomInspector();

    function saveSelector(sel, price) {
        let url = document.querySelector('meta[property="og:url"],meta[name="og:url"]');
        url = url === null ? location.href : url.getAttribute('content');

        let title = document.querySelector('meta[property="og:title"],meta[name="og:title"]');
        title = title === null ? document.title : title.getAttribute('content');

        chrome.runtime.sendMessage({
            action: 'tracking-selector',
            data: {
                url: url,
                selector: sel,
                title: title,
                history: [
                    {
                        price: price,
                        time: new Date().getTime(),
                    },
                ],
            },
        });
    }

    function cleanInspector() {
        const $inspector = document.querySelector('.dom-inspector');
        if ($inspector !== null) $inspector.remove();
    }

    async function preview(sel) {
        let price;

        try {
            let res = await fetch(location.href);
            res = await res.text();
            const doc = new DOMParser().parseFromString(res, 'text/html');

            let content = doc.querySelector(sel);
            if (content === null) {
                alert(chrome.i18n.getMessage('not_found'));
                return;
            }

            content = content.textContent.trim();
            price = content.replace(/\D/g, '');
            // eslint-disable-next-line no-empty
        } catch (error) {}

        if (!price) {
            alert(chrome.i18n.getMessage('not_found'));
            return;
        }

        if (confirm(chrome.i18n.getMessage('preview') + `\n"${price}"`)) {
            saveSelector(sel, price);

            document.removeEventListener('click', clickDom);
            inspector.destroy();
            cleanInspector();
        } else {
            inspector.enable();
            document.addEventListener('click', clickDom);
        }
    }

    function trimSelector(arr, out = '') {
        if (!arr.length) return out;

        const last = arr.pop();
        out = out ? `${last}>${out}` : last;

        if (last.includes('#')) return out;
        if (out.split(/>|\./).length > 7) return out;

        return trimSelector(arr, out);
    }

    function clickDom(e) {
        e.preventDefault();

        let sel = inspector.getSelector();

        sel = sel.replace(/^html>body/, '');
        if (!sel) return;

        sel = sel.split('>');
        if (!sel.length) return;

        sel = trimSelector(sel);
        preview(sel);
    }

    inspector.enable();
    document.addEventListener('click', clickDom);

    function destroyInspector(e) {
        e.preventDefault();

        document.removeEventListener('contextmenu', destroyInspector);
        if (!inspector) return;

        document.removeEventListener('click', clickDom);
        inspector.destroy();
        cleanInspector();
    }

    document.addEventListener('contextmenu', destroyInspector);
})();
