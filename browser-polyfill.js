// this polyfill provides a compatibility layer for Firefox's browser API
// when running in Chrome/Edge which use the chrome namespace

(function() {
    'use strict';

    if (typeof globalThis.browser === 'undefined') {
        const promisify = (context, method) => {
            return (...args) => {
                return new Promise((resolve, reject) => {
                    context[method](...args, result => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve(result);
                        }
                    });
                });
            };
        };

        // create a browser namespace if it doesn't exist
        globalThis.browser = globalThis.browser || {};

        // define API methods that should be promisified
        const apiFunctions = {
            tabs: ['create', 'query', 'update', 'remove'],
            storage: {
                sync: ['get', 'set', 'clear']
            },
            runtime: ['sendMessage', 'getURL'],
            scripting: ['executeScript'],
            notifications: ['create', 'clear']
        };

        // handle storage API specially since it has sub-namespaces
        if (chrome.storage && chrome.storage.sync) {
            browser.storage = browser.storage || {};
            browser.storage.sync = browser.storage.sync || {};
            browser.storage.sync.get = promisify(chrome.storage.sync, 'get');
            browser.storage.sync.set = promisify(chrome.storage.sync, 'set');
            browser.storage.sync.clear = promisify(chrome.storage.sync, 'clear');
        }

        // handle the rest of the APIs
        for (const [api, methods] of Object.entries(apiFunctions)) {
            if (api !== 'storage' && chrome[api]) {
                browser[api] = browser[api] || {};
                if (Array.isArray(methods)) {
                    for (const method of methods) {
                        if (chrome[api][method]) {
                            browser[api][method] = promisify(chrome[api], method);
                        }
                    }
                }
                // copy over any API methods we didn't explicitly wrap
                for (const key in chrome[api]) {
                    if (!browser[api][key]) {
                        browser[api][key] = chrome[api][key];
                    }
                }
            }
        }

        // copy any other APIs we've missed
        for (const key in chrome) {
            if (!browser[key]) {
                browser[key] = chrome[key];
            }
        }
    }
})();
