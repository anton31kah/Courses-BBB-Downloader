function listenForClicks() {
	document.addEventListener("click", (e) => {

		function download(tabs, preselect = undefined) {
			const validatingRegex = /https?:\/\/bbb(-\w+)?\.finki\.ukim\.mk\/playback\/presentation\/2\.0\/playback\.html\?meetingId=\w{40}-\w{13}/;
			const meetingIdRegex = /meetingId=(\w+-\w+)/;
			let currentTab = tabs[0];
			if (validatingRegex.test(currentTab.url)) {
				let meetingId = meetingIdRegex.exec(currentTab.url)[0];
				let scriptUrl = "https://raw.githubusercontent.com/anton31kah/Courses-BBB-Downloader/master/resources/create_lecture.ps1";

				let downloadSelection = {
					meetingId, scriptUrl
				};
				let checkboxs = document.querySelectorAll("input[type=checkbox]");

				for (const checkbox of checkboxs) {
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
			} else {
				Promise.reject('Invalid url');
			}
		}

		function downloadSlidesAndAudio(tabs) {
			return download(tabs, ["slides", "audio"])
		}

		function downloadVideoAndAudio(tabs) {
			return download(tabs, ["video", "audio"])
		}

		function reportError(error) {
			console.error(`Could not beastify: ${error}`);
		}

		let operationPromise = browser.tabs.query({ active: true, currentWindow: true });
		if (e.target.classList.contains("download-selected")) {
			operationPromise = operationPromise
				.then(download);
		} else if (e.target.classList.contains("download-slides-audio")) {
			operationPromise = operationPromise
				.then(downloadSlidesAndAudio);
		} else if (e.target.classList.contains("download-video-audio")) {
			operationPromise = operationPromise
				.then(downloadVideoAndAudio);
		}
		operationPromise = operationPromise.catch(reportError);
	});
}

function reportExecuteScriptError(error) {
	document.querySelector("#popup-content").classList.add("hidden");
	document.querySelector("#error-content").classList.remove("hidden");
	console.error(`Failed to execute beastify content script: ${error.message}`);
}

function loadScripts(scripts) {
	if (scripts.length < 1) {
		browser.tabs.executeScript({ code: `console.error("INVALID SCRIPTS");` });
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

loadScripts([
	"/external_dependencies/jquery/jquery-3.5.0.min.js",
	"/external_dependencies/bootstrap/bootstrap.min.css",
	"/external_dependencies/bootstrap/bootstrap.min.js",
	"/external_dependencies/filesaver/FileSaver.min.js",
	"/external_dependencies/jszip/jszip-utils.min.js",
	"/external_dependencies/jszip/jszip.min.js",
	"/content_scripts/downloader.js"
])
	.then(listenForClicks)
	.catch(reportExecuteScriptError);
