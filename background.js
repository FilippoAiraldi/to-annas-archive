'use strict';

const DEFAULT_OPTS = {
    url: "https://annas-archive.org/",
    openInNewTab: true
};
const WEBSITES = [
    {name: "IEEEXplore", urlmatch: "ieeexplore"},
    {name: "Oxford Academic", urlmatch: "academic.oup"},
    {name: "Springer Link", urlmatch: "springer"},
    {name: "ScienceDirect", urlmatch: "sciencedirect"},
    {name: "PubMed", urlmatch: "pubmed"},
    {name: "JSTOR", urlmatch: "jstor"}
];


function showNotification(message) {
    browser.notifications.create({
        type: "basic",
        iconUrl: browser.runtime.getURL("icons/96x96.png"),
        title: "To Anna's Archive",
        message: message
    });
}

function identifyWebsite(url) {
    const url_lower = url.toLowerCase();
    for (const website of WEBSITES) {
        if (url_lower.includes(website.urlmatch.toLowerCase())) {
            return website.name;
        }
    }
    return null;
}

/**
 * Function to be injected into the page to extract article data
 */
function extractArticleData(website) {
    // NOTE: this function runs in the context of the webpage, not the background script
    // and does not have access to the background script's variables or functions.
    switch (website) {
        case "IEEEXplore":
            return null;
        case "Oxford Academic":
            return null;
        case "Springer Link":
            return null;
        case "ScienceDirect":
            return null;
        case "PubMed":
            return null;
        case "JSTOR":
            return null;
        default:
            return null;
    }
}

/**
 * Opens a URL in either a new tab or the current tab
 */
function openUrl(url, openInNewTab) {
    if (openInNewTab) {
        browser.tabs.create({ url: url });
    } else {
        browser.tabs.query({ active: true, currentWindow: true })
            .then(tabs => {
                if (tabs[0]) {
                    browser.tabs.update(tabs[0].id, { url: url });
                } else {
                    showNotification("No active tab found to navigate.");
                }
            });
    }
}

/**
 * Opens Anna's Archive with search parameters
 */
function searchAnnasArchive(articleData) {
    browser.storage.sync.get(DEFAULT_OPTS)
        .then(options => {
            // Create search URL with extracted data
            let searchQuery = encodeURIComponent(`${articleData.title} ${articleData.authors}`.trim());
            const targetUrl = `${options.url}search?q=${searchQuery}`;

            openUrl(targetUrl, options.openInNewTab);
        })
        .catch(error => {
            console.error('[BACKGROUND] Error retrieving options:', error);
            showNotification(`Error retrieving options: ${error.message}`);
        });
}

function openAnnasArchive() {
    browser.tabs.query({ active: true, currentWindow: true })
        .then(async tabs => {
            if (!tabs || !tabs[0]) {
                showNotification("No active tab found.");
                return;
            }

            const currentTab = tabs[0];
            const currentUrl = currentTab.url;
            var shortTitle = currentTab.title;
            if (shortTitle.length > 50) {
                shortTitle = shortTitle.substring(0, 50) + '...';
            }
            const website = identifyWebsite(currentUrl);

            if (website) {
                browser.scripting.executeScript({
                    target: { tabId: currentTab.id },
                    func: extractArticleData,
                    args: [website]
                }).then(results => {
                    console.log('[BACKGROUND] AFTER EXTRACTING', results);
                }).catch(error => {
                    console.error('[BACKGROUND] Error extracting data:', error);
                    showNotification(`\"${shortTitle}\" recognized from ${website}, but got error during parsing: ${error.message}`);
                });
            } else {
                var title = currentTab.title;
                if (title.length > 50) {
                    title = title.substring(0, 50) + '...';
                }
                console.warn('[BACKGROUND] failed to recognize tab:', currentTab);
                showNotification(`\"${shortTitle}\" is not recognized as an academic site.`);
            }
        });
}

browser.action.onClicked.addListener(openAnnasArchive);
