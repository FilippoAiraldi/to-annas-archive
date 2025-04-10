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

function extractDoi(website) {
    // NOTE: this function runs in the context of the webpage, not the background script
    // and does not have access to the background script's variables or functions.

    var doi = undefined;

    switch (website) {
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

function searchAnnasArchive(articleDoi) {
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
                    func: extractDoi,
                    args: [website],
                    world: "MAIN"  // needed to access context of the page
                }).then(results => {
                    const extractedDoi = results[0].result;
                    if (extractedDoi) {
                        console.log('[BACKGROUND] Successfully extracted DOI:', extractedDoi);
                        searchAnnasArchive(extractedDoi);
                    } else {
                        console.warn('[BACKGROUND] Failed to extract article DOI:', website);
                        showNotification(`\"${shortTitle}\": could not extract any article DOI.`);
                    }
                }).catch(error => {
                    console.error('[BACKGROUND] Error extracting DOI:', error);
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
