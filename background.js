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

    // we try to extract title, authors, and DOI from the page. If the authors are
    // missing, it's not a big deal. If both title and DOI are missing, the extraction
    // failed.

    switch (website) {
        case "IEEEXplore":
            if (typeof xplGlobal === 'undefined') {
                return null;
            }
            var title = xplGlobal?.document?.metadata?.title;
            var doi = xplGlobal?.document?.metadata?.doi;
            try {
                var authors = xplGlobal?.document?.metadata?.authors?.map(
                    author => author?.name
                )?.join(', ');
            } catch {
                var authors = undefined;
            }
            break;

        case "Oxford Academic":
            if (typeof dataLayer === 'undefined') {
                return null;
            }
            var title = dataLayer[0]?.full_title;
            var doi = dataLayer[0]?.doi;
            var authors = dataLayer[0]?.authors;
            break;

        case "Springer Link":
            var title = document?.querySelector('h1.c-article-title')?.textContent;
            var doi = dataLayer[0].DOI;
            try {
                var authors = Array.from(
                    document?.querySelectorAll("a[data-test='author-name']")
                )?.map(item => item?.textContent)?.join(', ');
            } catch {
                var authors = undefined;
            }
            break;

        case "ScienceDirect":
            var title = document?.querySelector('span.title-text')?.textContent;
            var doi = document?.querySelector(
                'a.anchor.doi.anchor-primary'
            )?.querySelector('span.anchor-text')?.textContent?.slice(16);
            try {
                var authors = Array.from(
                    document?.getElementsByClassName('text surname')
                )?.map(item => item?.textContent)?.join(', ');
            } catch {
                var authors = undefined;
            }
            break;

        case "PubMed":
            var title = document?.querySelector('h1.heading-title')?.textContent?.trim();
            var doi = document?.querySelector('.doi')?.children[1]?.textContent?.trim();
            try {
                var authors = Array.from(
                    document?.querySelectorAll('.authors-list-item')
                )?.map(item => item?.firstChild?.textContent)?.join(', ');
            } catch {
                var authors = undefined;
            }
            break;

        case "JSTOR":
            if (typeof dataLayer === 'undefined') {
                return null;
            }
            var title = dataLayer[0]?.content?.chapterTitle;
            if (!title) {
                title = dataLayer[0]?.content?.itemTitle;
            }
            var doi = dataLayer[0]?.content?.objectDOI;
            try {
                var authors = Array.from(
                    document?.querySelectorAll("mfe-content-details-pharos-link[data-qa='item-authors']")
                )?.map(item => item?.textContent)?.join(', ');
            } catch {
                var authors = undefined;
            }
            if (!authors) {
                authors = document?.querySelector('p.content-meta-data__authors')?.textContent;
            }
            break;

        default:
            return null;
    }

    // if both title and doi are null, we return null
    if (!title && !doi) {
        console.warn('[BACKGROUND] Failed to extract article data:', website);
        return null;
    }
    return {title: title, authors: authors, doi: doi};
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
                    args: [website],
                    world: "MAIN"  // needed to access context of the page
                }).then(results => {
                    const extractedData = results[0].result;
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
