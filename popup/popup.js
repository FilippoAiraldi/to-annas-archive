const [currentTab] = await browser.tabs.query({ active: true, currentWindow: true });
const { errorMessage } = await browser.runtime.sendMessage({ currentTab });
if (errorMessage) {
    const errorMessageElement = document.querySelector('#error-message')
    errorMessageElement.innerText = errorMessage
    errorMessageElement.removeAttribute('hidden')
    setTimeout(() => window.close(), 3_500)
} else {
    window.close()
}
