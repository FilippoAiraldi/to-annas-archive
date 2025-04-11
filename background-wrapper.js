// this wrapper ensures the browser polyfill is loaded before the background script
// this allows the extension to work in both Firefox and Chromium-based browsers

importScripts('browser-polyfill.js');
importScripts('background.js');
