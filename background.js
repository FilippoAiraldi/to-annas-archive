function openSpecificUrl() {
	const url = "https://stackoverflow.com/questions/75043889/manifest-v3-background-scripts-service-worker-on-firefox";
	browser.tabs.create({ url });
}

browser.action.onClicked.addListener(openSpecificUrl);
