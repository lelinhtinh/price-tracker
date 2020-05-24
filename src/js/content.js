(function (global) {
    const inspector = new DomInspector();

    function saveSelector(sel) {
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
            },
        });
    }

    function cleanInspector() {
        const $inspector = document.querySelector('.dom-inspector');
        if ($inspector !== null) $inspector.remove();
    }

    function preview(sel) {
        let content;
        try {
            content = document.querySelector(sel).textContent.trim();
        } catch (error) {}
        if (!content) return;

        if (confirm(chrome.i18n.getMessage('preview') + `\n"${content}"`)) {
            saveSelector(sel);

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
})(window);
