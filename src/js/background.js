let matchUrls = ['https://maytinhdalat.com/*'];

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

chrome.browserAction.onClicked.addListener((e) => {
    chrome.tabs.executeScript({
        file: 'src/js/vendor/dom-inspector.min.js',
    });
    chrome.tabs.executeScript({
        file: 'src/js/content.js',
    });
});

chrome.runtime.onMessage.addListener((message) => {
    if (message.action !== 'tracking-selector') return;
    console.log(message.data);
});
