function isUrlValid(url) {
    const validatingRegex = /https?:\/\/bbb(-\w+)?\.finki\.ukim\.mk\/playback\/presentation\/2\.0\/playback\.html\?meetingId=\w{40}-\w{13}/;

    return validatingRegex.test(url)
}

function consoleLog(text) {
    return browser.tabs.executeScript({code: `console.log(${JSON.stringify(text)});`});
}

function consoleError(text) {
    return browser.tabs.executeScript({code: `console.error(${JSON.stringify(text)});`});
}

function listenForClicks() {
    document.addEventListener("click", (e) => {

        function download(tabs, chosenItem) {
            let currentTab = tabs[0];

            browser.tabs.sendMessage(currentTab.id, {
                command: "cbd-download-bbb",
                downloadSelection: chosenItem
            })
        }

        function reportError(error) {
            consoleError(`Courses-BBB-Downloader Error: ${error}`);
        }

        browser.tabs.query({active: true, currentWindow: true})
            .then(activeTabs => download(activeTabs, e.target.id))
            .catch(reportError);
    });
}

function determineElementsToShow() {
    function checkIfExists(tabs, buttonElement) {
        let currentTab = tabs[0];

        return browser.tabs.sendMessage(currentTab.id, {
            command: "cdb-check-exists",
            elementToCheck: buttonElement.name
        }).then(shouldShow => {
            buttonElement.style.display = shouldShow ? "" : "none";
        });
    }

    const buttons = document.getElementsByTagName("button");
    for (let button of buttons) {
        browser.tabs.query({active: true, currentWindow: true})
            .then(activeTabs => checkIfExists(activeTabs, button))
            .catch(error => consoleError(`Courses-BBB-Downloader Error: ${error}`));
    }
}

function reportExecuteScriptError(error) {
    document.querySelector("#popup-content").classList.add("hidden");
    document.querySelector("#error-content").classList.remove("hidden");
    document.querySelector("#error-content > p").textContent = error.message;
    consoleError(`Failed to execute downloader content script: ${JSON.stringify(error)}`);
}

function loadScripts(scripts) {
    if (scripts.length < 1) {
        consoleError("INVALID SCRIPTS");
        return Promise.reject("INVALID SCRIPTS");
    }

    const getScript = (script) => {
        if (script.endsWith(".js"))
            return browser.tabs.executeScript({file: script});
        else
            return browser.tabs.insertCSS({file: script});
    };

    let mainPromise = getScript(scripts[0]);

    for (const script of scripts.slice(1)) {
        mainPromise = mainPromise.then(() => getScript(script));
    }

    return mainPromise;
}

browser.tabs.query({active: true, currentWindow: true})
    .then(tabs => {
        let currentTab = tabs[0];
        if (!isUrlValid(currentTab.url)) {
            throw {
                message: "Invalid tab url"
            };
        }
    })
    .then(() => loadScripts([
        "/external_dependencies/filesaver/FileSaver.min.js",
        "/external_dependencies/jszip/jszip-utils.min.js",
        "/external_dependencies/jszip/jszip.min.js",
        "/content_scripts/downloader.js"
    ]))
    .then(listenForClicks)
    .then(determineElementsToShow)
    .catch(reportExecuteScriptError);
