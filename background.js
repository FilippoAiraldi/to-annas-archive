'use strict';

// default options in case storage fails
const defaultOptions = {
    url: "https://annas-archive.org/",
    openInNewTab: true
};

/**
 * Opens Anna's Archive with the current options
 * Uses user-selected options from storage
 */
function openAnnasArchive() {
    browser.storage.sync.get(defaultOptions)
        .then(options => {
            const targetUrl = options.url;

            if (options.openInNewTab) {
                browser.tabs.create({ url: targetUrl });
            } else {
                browser.tabs.query({ active: true, currentWindow: true })
                    .then(tabs => {
                        if (tabs[0]) {
                            browser.tabs.update(tabs[0].id, { url: targetUrl });
                        } else {
                            // Fallback if no active tab is found
                            browser.tabs.create({ url: targetUrl });
                        }
                    });
            }
        })
        .catch(error => {
            console.error('[BACKGROUND] Error retrieving options:', error);
            browser.tabs.create({ url: defaultOptions.url });
        });
}

// Listen for extension icon clicks
browser.action.onClicked.addListener(openAnnasArchive);
