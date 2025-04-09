'use strict';

const MIRRORS = [
    "https://annas-archive.org/",
    "https://annas-archive.se/",
    "https://annas-archive.li/",
    "https://kmr.annas-archive.org/"
];
const IMG_NAME = "favicon.ico";
const DEFAULT_OPTS = {url: "https://annas-archive.org/", openInNewTab: true};

var linksTable = document.getElementById("links");
var linksCounts = [];


function saveOptions() {
    const options = {
        url: document.getElementById("url").value,
        openInNewTab: document.getElementById("open-in-new-tab").checked
    };

    browser.storage.sync.set(options)
        .then(() => console.log('[OPTIONS] Options saved'))
        .catch(error => console.error('[OPTIONS] Error saving options:', error));
}

document.getElementById("url").addEventListener('change', saveOptions);
document.getElementById("open-in-new-tab").addEventListener('change', saveOptions);


function loadOptions() {
    browser.storage.sync.get(DEFAULT_OPTS)
        .then(result => {
            document.getElementById("url").value = result.url;
            document.getElementById("open-in-new-tab").checked = result.openInNewTab;
        })
        .catch(error => console.error('[OPTIONS] Error loading options:', error));
}

document.addEventListener('DOMContentLoaded', loadOptions);


function getField(propname) {
    return document.getElementById(propnameFieldnameMap[propname]);
}

function setUrl(i) {
    const field = document.getElementById("url");
    field.value = MIRRORS[i];
    saveOptions();  // save options when a mirror URL is selected
}

function checkServerStatus(i) {
    function callback(ok) {
        linksTable.rows[i + 1].style.backgroundColor = ok ? "lightgreen" : "pink"
    }

    var img = document.body.appendChild(document.createElement("img"));
    img.height = 0;
    img.visibility = "hidden";
    img.onload = function () { return callback(true); };
    img.onerror = function () { return callback(false); }
    img.src = MIRRORS[i] + IMG_NAME;
}

async function fillUrls() {
    try {
        for (let i = 0; i < MIRRORS.length; ++i) {
            linksCounts.push([0, 0]);
            const row = linksTable.insertRow();

            const linkCell = row.insertCell(0);
            linkCell.textContent = MIRRORS[i];

            const buttonCell = row.insertCell(1);
            const button = document.createElement("button");
            button.textContent = "Select";
            button.id = "link" + i;
            buttonCell.appendChild(button);
            button.addEventListener("click", () => setUrl(i));
        }

        for (let i = 0; i < MIRRORS.length; ++i) {
            linksTable.rows[i + 1].style.backgroundColor = "#aaa";
            setTimeout(checkServerStatus, 250, i);
        }
    } catch (error) {
        console.error('[OPTIONS] Error occurred while fetching URLs:', error);
    }
}

fillUrls();
