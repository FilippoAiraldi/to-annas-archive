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
    {name: "JSTOR", urlmatch: "jstor"},
    {name: "MDPI", urlmatch: "mdpi"}
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

function extractDoi(websiteMatch) {
    // NOTE: this function runs in the context of the webpage, not the background script
    // and does not have access to the background script's variables or functions.

    var doi = undefined;

    switch (websiteMatch) {
        case "IEEEXplore":
            if (typeof xplGlobal !== 'undefined') {
                doi = xplGlobal?.document?.metadata?.doi;
            }
            break;

        case "Oxford Academic":
            if (typeof dataLayer !== 'undefined') {
                doi = dataLayer[0]?.doi;
            }
            break;

        case "Springer Link":
            if (typeof dataLayer !== 'undefined') {
                doi = dataLayer[0]?.DOI;
            }
            break;

        case "ScienceDirect":
            doi = document?.querySelector('a.anchor.doi.anchor-primary')?.querySelector('span.anchor-text')?.textContent?.slice(16);
            break;

        case "PubMed":
            doi = document?.querySelector('.doi')?.children[1]?.textContent?.trim();
            break;

        case "JSTOR":
            if (typeof dataLayer !== 'undefined') {
                doi = dataLayer[0]?.content?.objectDOI;
            }
            break;

        case "MDPI":
            doi = document?.querySelector('a[href^="https://doi.org/"]')?.textContent?.slice(16);
            break;
    }

    // last fallback: regex for DOI
    if (!doi && typeof document !== 'undefined') {
        console.log('[BACKGROUND] Attempting to extract DOI via regex');
        const htmlSource = document?.documentElement?.innerHTML;
        if (htmlSource) {
            const doiRegex = new RegExp(
                /\b(10[.][0-9]{4,}(?:[.][0-9]+)*\/(?:(?!["&\'<>])\S)+)\b/
            );
            const doiMatch = htmlSource.match(doiRegex);
            if (doiMatch) {
                doi = doiMatch[0].split(";")[0];
            }
        }
    }
    return doi;
}

function refineDoi(doi) {
    doi = doi.toLowerCase().trim();
    // quotes
    const quotes = ['"', "'", "‘", "’", "“", "”"];
    for (const quote of quotes) {
        if (doi.startsWith(quote)) {
            doi = doi.substring(1);
        } else if (doi.endsWith(quote)) {
            doi = doi.substring(0, doi.length - 1);
        }
    }
    // prefixes
    if (doi.startsWith('doi:')) {
        doi = doi.substring(4);
    } else if (doi.startsWith('doi')) {
        doi = doi.substring(3);
    }
    // suffixes
    if (doi.endsWith('.pdf')) {
        doi = doi.substring(0, doi.length - 4);
    } else if (doi.endsWith('pdf')) {
        doi = doi.substring(0, doi.length - 3);
    }
    return doi;
}

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

function searchAnnasArchive(articleDoi) {
    browser.storage.sync.get(DEFAULT_OPTS)
        .then(options => {
            const targetUrl = new URL('scidb/' + articleDoi.toLowerCase(), options.url);
            openUrl(targetUrl.toString(), options.openInNewTab);
        })
        .catch(error => {
            console.error('[BACKGROUND] Error opening URL to Anna\'s Archive:', error);
            showNotification(`Error opening URL to Anna's Archive: ${error.message}`);
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

            browser.scripting.executeScript({
                target: { tabId: currentTab.id },
                func: extractDoi,
                args: [website],
                world: "MAIN"  // needed to access context of the page
            }).then(results => {
                const extractedDoi = results[0].result;
                if (extractedDoi) {
                    console.log('[BACKGROUND] Successfully extracted DOI:', extractedDoi);
                    searchAnnasArchive(refineDoi(extractedDoi));
                } else {
                    console.warn('[BACKGROUND] Failed to extract article DOI:', currentUrl);
                    showNotification(`\"${shortTitle}\": could not extract any article DOI.`);
                }
            }).catch(error => {
                console.error('[BACKGROUND] Error extracting article DOI:', error);
                showNotification(`\"${shortTitle}\": extraction of article DOI failed: ${error.message}`);
            });
        });
}

browser.action.onClicked.addListener(openAnnasArchive);
