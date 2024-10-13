'use strict';

const mirrorsDb = "https://raw.githubusercontent.com/FilippoAiraldi/to-annas-archive/refs/heads/master/data/mirrors.json";
const imgName = "favicon.ico"
var links;
var linksTable = document.getElementById("links");
var linksCounts = [];

function getField(propname) {
    return document.getElementById(propnameFieldnameMap[propname]);
}

function setUrl(links, i) {
    const field = document.getElementById("url");
    field.value = links[i];
    // propnameValueCache["url"] = links[i];
    field.onchange();
}

function checkServerStatus(links, i) {
    function callback(ok) {
        linksTable.rows[i + 1].style.backgroundColor = ok ? "lightgreen" : "pink"
    }

    var img = document.body.appendChild(document.createElement("img"));
    img.height = 0;
    img.visibility = "hidden";
    img.onload = function () { return callback(true); };
    img.onerror = function () { return callback(false); }
    img.src = links[i] + imgName;
}

async function fillUrls() {
    try {
        const response = await fetch(mirrorsDb);
        if (!response.ok) {
            throw new Error(`failed to fetch URLs: ${response.statusText}`);
        }

        const links = await response.json();

        for (let i = 0; i < links.length; ++i) {
            linksCounts.push([0, 0]);
            const row = linksTable.insertRow();

            const linkCell = row.insertCell(0);
            linkCell.textContent = links[i];

            const buttonCell = row.insertCell(1);
            const button = document.createElement("button");
            button.textContent = "Select";
            button.id = "link" + i;
            buttonCell.appendChild(button);
            button.addEventListener("click", () => setUrl(links, i));
        }

        for (let i = 0; i < links.length; ++i) {
            linksTable.rows[i + 1].style.backgroundColor = "#aaa";
            setTimeout(checkServerStatus, 250, links, i);
        }
    } catch (error) {
        console.error('[OPTIONS] Error occurred while fetching URLs:', error);
    }
}

fillUrls();
