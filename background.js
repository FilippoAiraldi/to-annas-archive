'use strict';

const defaultOptions = {
    url: "https://annas-archive.org/",
    openInNewTab: true
};
const extractorsDb = "https://raw.githubusercontent.com/FilippoAiraldi/to-annas-archive/refs/heads/master/data/extractors.json";
let extractorsCache = null;

/**
 * Shows a notification to the user
 * @param {string} message - The message to display in the notification
 */
function showNotification(message) {
    browser.notifications.create({
        type: "basic",
        iconUrl: browser.runtime.getURL("icons/96x96.png"),
        title: "To Anna's Archive",
        message: message
    });
}

/**
 * Determines which academic site the current tab is on
 * @param {string} url - The URL of the current tab
 * @returns {object|null} The extractor object for the identified site, or null if not found
 */
async function identifyWebsite(url) {
    try {
        // use cached extractors if available, otherwise fetch them
        if (!extractorsCache) {
            const response = await fetch(extractorsDb);
            extractorsCache = await response.json();
            console.log('[BACKGROUND] Extractors data cached successfully');
        }

        // check each extractor for a match with the current URL
        for (const extractor of extractorsCache) {
            if (url.toLowerCase().includes(extractor.urlmatch.toLowerCase())) {
                return extractor;
            }
        }
        return null;
    } catch (error) {
        console.error('[BACKGROUND] Error loading extractors:', error);
        extractorsCache = null; // reset cache on error to try again next time
        showNotification(`Error loading extractors: ${error.message}`);
        return null;
    }
}

/**
 * Function to be injected into the page to extract article data
 */
function extractArticleData(extractors) {
    try {
        const title = eval(extractors.title);
        const authors = eval(extractors.authors);
        const doi = extractors.doi ? eval(extractors.doi) : '';

        return {
            title: title || '',
            authors: authors || '',
            doi: doi || ''
        };
    } catch (error) {
        console.error('Error extracting article data:', error);
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
    browser.storage.sync.get(defaultOptions)
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

/**
 * Opens Anna's Archive with the current options
 * Uses user-selected options from storage
 */
function openAnnasArchive() {
    browser.tabs.query({ active: true, currentWindow: true })
        .then(async tabs => {
            if (!tabs || !tabs[0]) {
                showNotification("No active tab found.");
                return;
            }

            const currentTab = tabs[0];
            const currentUrl = currentTab.url;

            // identify which academic site we're on
            const extractor = await identifyWebsite(currentUrl);
            if (extractor) {
                // we're on a supported academic site, extract data and search on Anna's Archive
                browser.scripting.executeScript({
                    target: { tabId: currentTab.id },
                    func: extractArticleData,
                    args: [extractor.extractors]
                }).then(results => {
                    const extractedData = results[0].result;
                    if (extractedData) {
                        searchAnnasArchive(extractedData);
                    } else {
                        showNotification("Could not extract article data from the current page.");
                    }
                }).catch(error => {
                    console.error('[BACKGROUND] Error extracting data:', error);
                    showNotification(`Error extracting data: ${error.message}`);
                });
            } else {
                // not on a supported academic site
                showNotification("Current page is not recognized as an academic site.");
            }
        });
}

browser.action.onClicked.addListener(openAnnasArchive);
