function isUrlValid(url) {
	const validatingRegex = /https?:\/\/bbb(-\w+)?\.finki\.ukim\.mk\/playback\/presentation\/2\.0\/playback\.html\?meetingId=\w{40}-\w{13}/;

	return validatingRegex.test(url)
}

function consoleLog(text) {
	browser.tabs.executeScript({ code: `console.log(${JSON.stringify(text)});` });
}

function consoleError(text) {
	browser.tabs.executeScript({ code: `console.error(${JSON.stringify(text)});` });
}

function listenForClicks() {
	document.addEventListener("click", (e) => {

		function download(tabs, preselect = undefined) {
			let currentTab = tabs[0];

			const meetingIdRegex = /meetingId=(\w+-\w+)/;

			let meetingId = meetingIdRegex.exec(currentTab.url)[0];

			let scriptUrl = "https://raw.githubusercontent.com/anton31kah/Courses-BBB-Downloader/master/resources/create_lecture.ps1";

			let downloadSelection = {
				meetingId, scriptUrl
			};

			let checkboxes = document.querySelectorAll("input[type=checkbox]");

			for (const checkbox of checkboxes) {
				if (preselect === undefined) {
					downloadSelection[checkbox.name] = checkbox.checked;
				} else {
					downloadSelection[checkbox.name] = preselect.includes(checkbox.name);
				}
			}

			browser.tabs.sendMessage(currentTab.id, {
				command: "download-bbb",
				downloadSelection: downloadSelection
			})
		}

		function downloadSlidesAndAudio(tabs) {
			return download(tabs, ["slides", "audio"])
		}

		function downloadVideoAndAudio(tabs) {
			return download(tabs, ["video", "audio"])
		}

		function reportError(error) {
			consoleError(`Courses-BBB-Downloader Error: ${error}`);
		}

		let activeTabs = browser.tabs.query({ active: true, currentWindow: true });
		let classes = e.target.classList;

		if (classes.contains("download-selected")) {
			activeTabs = activeTabs.then(download);
		} else if (classes.contains("download-slides-audio")) {
			activeTabs = activeTabs.then(downloadSlidesAndAudio);
		} else if (classes.contains("download-video-audio")) {
			activeTabs = activeTabs.then(downloadVideoAndAudio);
		}

		activeTabs = activeTabs.catch(reportError);
	});
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
		if (script.endsWith('.js'))
			return browser.tabs.executeScript({ file: script });
		else
			return browser.tabs.insertCSS({ file: script });
	};

	let mainPromise = getScript(scripts[0]);

	for (const script of scripts.slice(1)) {
		mainPromise = mainPromise.then(r => getScript(script));
	}

	return mainPromise;
}

browser.tabs.query({ active: true, currentWindow: true })
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
		"/content_scripts/progress_bar.css",
		"/content_scripts/downloader.js"
	]))
	.then(listenForClicks)
	.catch(reportExecuteScriptError);
