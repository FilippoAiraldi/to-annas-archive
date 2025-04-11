<div align="center">
  <img src="https://raw.githubusercontent.com/FilippoAiraldi/to-annas-archive/master/icons/128x128.png" alt="to-annas-archive-logo" height="96">
</div>

# To Anna's Archive!

[![Supported Browsers](https://img.shields.io/badge/supported%20browsers-firefox%20|%20chrome%20|%20edge-informational?style=for-the-badge)](https://github.com/FilippoAiraldi/to-annas-archive/releases/latest)
[![Source Code License](https://img.shields.io/badge/license-MIT-blueviolet?style=for-the-badge)](https://github.com/FilippoAiraldi/to-annas-archive/blob/master/LICENSE)
[![Extension Version](https://img.shields.io/github/manifest-json/manifest_version/FilippoAiraldi/to-annas-archive?filename=manifest.json&style=for-the-badge&label=manifest%20version)](https://github.com/FilippoAiraldi/to-annas-archive/blob/master/manifest.json)

Quickly search papers on Anna's Archive 🧬 SciDB!

## How does it work?

Once its icon is clicked, the extension attempts to automatically extract the DOI from the current tab (for example, if visiting a journal paper's webpage) and, if successful, performs a search on Anna's Archive 🧬 SciDB with the DOI just found. In the options, the user can change the Archive's target mirror (in case some of them are unreachable or down), and choose whether the search should open in a new tab or not.

## Installation

### Firefox

The extension is awaiting approval to be distributed by the Mozilla webstore. At the same time, manual installation is available.

1. Download the [latest release](https://github.com/FilippoAiraldi/to-annas-archive/releases/latest) for Firefox
1. Unzip the file in the desired folder
1. In Firefox, type in the search bar _about:debugging_
1. In the new tab on the left panel, go to _This Firefox_
1. _Load Temporary Add-on_ -> select the unzipped folder.

Similar steps should work also for Firefox forks, e.g., LibreWolf.

### Chrome and Edge

The extension is not distributed via the Chrome/Edge webstore, so it must be loaded manually.

1. Download the [latest release](https://github.com/FilippoAiraldi/to-annas-archive/releases/latest) for Chromium
1. Unzip the file in the desired folder
1. In Edge, _Extensions_ -> _Manage extensions_
1. Enable _Developer mode_ (slider on the left panel in Edge, or in the top right corner in Chrome); you should now see the _Load unpacked_ button
1. _Load unpacked_ -> select the unzipped folder.

## Options

**Before the first use, it is recommended to check out the options!**

- **Firefox**: right click on extension's icon -> _Manage Extension_ -> _Options_ tab
- **Chrome**: vertical dots ⫶ near extension's name -> _Manage extension_ -> scroll down and click _Extension options_
- **Edge**: horizon dots ••• near extension's name ->  _Extension options_

As aforementioned, the options allow to customize the target mirror used to perform the paper search. The options page should look something like this:

<div align="center">
  <img src="https://raw.githubusercontent.com/FilippoAiraldi/to-annas-archive/master/resources/options.png" alt="to-annas-archive-options" height="400">
</div>

The user can input any URL in the top editable box. However, at the bottom the major mirrors are provided for convenience. They are color-coded based on whether they are reachable or not at the moment. Just click _Select_ and the mirror will be employed automatically. Lastly, an option for selecting whether the search should open in the current tab or in a new one is available.


## Thanks

A lot of inspiration was drawn from the [Sci-Hub Now!](https://github.com/0x01h/sci-hub-now) and [Sci-Hub X Now!](https://github.com/gchenfc/sci-hub-now) extensions!
