'use strict';

// default options in case storage fails
const defaultOptions = {
    url: "https://annas-archive.org/",
    openInNewTab: true
};

/**
 * Determines which academic site the current tab is on
 * @param {string} url - The URL of the current tab
 * @returns {object|null} The extractor object for the identified site, or null if not found
 */
async function identifyWebsite(url) {
    try {
        // Fetch the extractors from file
        const response = await fetch(browser.runtime.getURL('data/extractors.json'));
        const extractors = await response.json();

        // Check each site's identifier in the URL
        for (const site of extractors) {
            if (url.toLowerCase().includes(site.urlmatch.toLowerCase())) {
                return site;
            }
        }
        return null;
    } catch (error) {
        console.error('[BACKGROUND] Error loading extractors:', error);
        return null;
    }
}

/**
 * Opens Anna's Archive with the current options
 * Uses user-selected options from storage
 */
function openAnnasArchive() {
    browser.tabs.query({ active: true, currentWindow: true })
        .then(async tabs => {
            if (!tabs || !tabs[0]) {
                openDefaultAnnasPage();
                return;
            }

            const currentTab = tabs[0];
            const currentUrl = currentTab.url;

            // identify which academic site we're on
            const site = await identifyWebsite(currentUrl);
            if (site) {
                // we're on a supported academic site, extract data and search on Anna's Archive
                browser.scripting.executeScript({
                    target: { tabId: currentTab.id },
                    func: extractArticleData,
                    args: [site.extractors]
                }).then(results => {
                    const extractedData = results[0].result;
                    if (extractedData) {
                        searchAnnasArchive(extractedData);
                    } else {
                        openDefaultAnnasPage();
                    }
                }).catch(error => {
                    console.error('[BACKGROUND] Error extracting data:', error);
                    openDefaultAnnasPage();
                });
            } else {
                // not on a supported academic site, just open Anna's Archive
                openDefaultAnnasPage();
            }
        });
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
            openDefaultAnnasPage();
        });
}

/**
 * Opens the default Anna's Archive page
 */
function openDefaultAnnasPage() {
    browser.storage.sync.get(defaultOptions)
        .then(options => {
            openUrl(options.url, options.openInNewTab);
        })
        .catch(error => {
            console.error('[BACKGROUND] Error retrieving options:', error);
            browser.tabs.create({ url: defaultOptions.url });
        });
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
                    // Fallback if no active tab is found
                    browser.tabs.create({ url: url });
                }
            });
    }
}

// Listen for extension icon clicks
browser.action.onClicked.addListener(openAnnasArchive);
