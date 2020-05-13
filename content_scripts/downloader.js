(function () {
	if (window.hasRun) {
		return;
	}
	window.hasRun = true;


	function fetchDownloadItems(downloadSelection) {
		let urlsToDownload = {};

		let [video, audio] = document.querySelectorAll("source[src$=webm]");
		let slides = document.getElementsByClassName("slide");
		if (downloadSelection.audio) {
			let audioUrl = audio.src;
			urlsToDownload.audio = audioUrl;
		}
		if (downloadSelection.video) {
			let videoUrl = video.src;
			urlsToDownload.video = videoUrl;
		}
		if (downloadSelection.slides) {
			urlsToDownload.slides = [];
			for (const slide of slides) {
				let start = parseFloat(slide.getAttribute("in"));
				let end = parseFloat(slide.getAttribute("out"));
				let slideUrl = `${window.location.protocol}//${window.location.host}${slide.href.baseVal}`;
				urlsToDownload.slides.push({
					url: slideUrl,
					start: start,
					end: end
				});
			}
		}

		return urlsToDownload;
	}

	function createProgressBar(file) {
		let downloadStatusDivElement = document.getElementById('cbd-download-status');

		let progressBarParentDivElement = document.createElement('div');
		progressBarParentDivElement.id = `cbd-progress-bar-${file}`;
		progressBarParentDivElement.classList.add("cbd-progress");

		let progressBarElement = document.createElement('div');
		progressBarElement.classList.add("cbd-progress-bar");

		let progressTextElement = document.createElement('div');
		progressTextElement.classList.add("cbd-progress-text");

		progressBarParentDivElement.appendChild(progressBarElement);
		progressBarParentDivElement.appendChild(progressTextElement);


		let resultStatusElement = document.getElementById('cbd-result');

		downloadStatusDivElement.insertBefore(progressBarParentDivElement, resultStatusElement);
	}

	function prepareDownloadProgress() {
		let downloadStatus = document.querySelector('body > #cbd-download-status');

		if (downloadStatus) {
			downloadStatus.parentNode.removeChild(downloadStatus);
		}

		let parentBody = document.querySelector('body');

		let downloadStatusDivElement = document.createElement('div');
		downloadStatusDivElement.id = "cbd-download-status";

		let resultStatusElement = document.createElement('p');
		resultStatusElement.id = "cbd-result";
		resultStatusElement.textContent = "Download process will start soon!";


		downloadStatusDivElement.appendChild(resultStatusElement);


		parentBody.insertBefore(downloadStatusDivElement, parentBody.firstChild);

		downloadStatus = downloadStatusDivElement;
	}

	function resetMessage() {
		let resultElement = document.getElementById("cbd-result");
		resultElement.classList.remove(...resultElement.classList);
		resultElement.textContent = "";
	}

	function showMessage(text) {
		resetMessage();
		let resultElement = document.getElementById("cbd-result");
		resultElement.classList.add("cbd-alert", "cbd-alert-success");
		resultElement.textContent = text;
		resultElement.title = "If it seems slow or that it stopped, please be patient, trust me, it's working. It didn't stop, neither did it break, it just doesn't send enough notifications so this message can be updated correctly.";
	}

	function showFinalMessage(text) {
		resetMessage();
		let resultElement = document.getElementById("cbd-result");
		resultElement.classList.add("cbd-alert", "cbd-alert-success");

		let linkElement = document.createElement('a');
		linkElement.id = "cbd-clear-progress";
		linkElement.textContent = text + " click here to close progress.";

		linkElement.addEventListener('click', () => {
			let toDelete = document.getElementById('cbd-download-status');
			toDelete.parentNode.removeChild(toDelete);
		});

		resultElement.appendChild(linkElement);
	}

	function showError(text) {
		resetMessage();
		let resultElement = document.getElementById("cbd-result");
		resultElement.classList.add("cbd-alert", "cbd-alert-danger");
		resultElement.textContent = text;
	}

	function updatePercent(percent, file) {
		let progressBarParentElement = document.getElementById(`cbd-progress-bar-${file}`);
		let progressBarElement = progressBarParentElement.getElementsByClassName("cbd-progress-bar")[0];
		let progressTextElement = progressBarParentElement.getElementsByClassName("cbd-progress-text")[0];
		progressBarElement.style.width = percent + "%";
		progressTextElement.textContent = `${percent.toFixed(2)}% ${file}`;

		if (percent >= 100) {
			let linkElement = document.createElement('a');
			linkElement.id = `cbd-clear-progress-${file}`;
			linkElement.textContent = " click here to close progress bar.";
			linkElement.setAttribute("style", "color: red;");

			linkElement.addEventListener('click', () => {
				progressBarParentElement.parentNode.removeChild(progressBarParentElement);
			});

			progressTextElement.appendChild(linkElement);
		}
	}

	function urlToPromise(url, progress_callback) {
		return new Promise(function (resolve, reject) {
			JSZipUtils.getBinaryContent(url, {
				callback: function (err, data) {
					if (err) {
						reject(err);
					} else {
						resolve(data);
					}
				},
				progress: progress_callback
			});
		});
	}

	function progressClosure(file) {
		const progressDownload = file => metadata => {
			let percent = metadata.percent;
			if (isNaN(percent)) {
				percent = 0;
			}
			updatePercent(percent, file);
		};

		return progressDownload(file);
	}

	function urlTextContent(url) {
		return fetch(url).then(data => data.text());
	}

	function handleDownloadProcess(downloadSelection) {
		let downloadQueue = fetchDownloadItems(downloadSelection);

		prepareDownloadProgress();

		let zip = new JSZip();

		zip.file('create_lecture.ps1', urlTextContent(downloadSelection.scriptUrl), { binary: true })

		if (downloadQueue.video) {
			createProgressBar("video");
			const progress_callback = progressClosure("video");
			zip.file('video.webm', urlToPromise(downloadQueue.video, progress_callback), { binary: true });
		}

		if (downloadQueue.audio) {
			createProgressBar("audio");
			const progress_callback = progressClosure("audio");
			zip.file('audio.webm', urlToPromise(downloadQueue.audio, progress_callback), { binary: true });
		}

		if (downloadQueue.slides) {
			let slidesFolder = zip.folder('slides');
			let timesFileContent = [];
			for (const [index, slide] of downloadQueue.slides.entries()) {
				createProgressBar(`slide-${index}`);
				const progress_callback = progressClosure(`slide-${index}`);
				slidesFolder.file(`slide-${index}.png`, urlToPromise(slide.url, progress_callback), { binary: true });
				timesFileContent.push(`${slide.start}-${slide.end}`);
			}
			timesFileContent = timesFileContent.join('\n');
			zip.file('slides-times.txt', timesFileContent);
		}

		zip.generateAsync({ type: "blob" }, metadata => {
			let msg = "progression : " + metadata.percent.toFixed(2) + " %";
			if (metadata.currentFile) {
				msg += ", current file = " + metadata.currentFile;
			}
			showMessage(msg);
		})
			.then(blob => {
				let lectureTitle = document.getElementById("recording-title").textContent;
				let meetingId = downloadSelection.meetingId;
				let fileName = `${lectureTitle}-${meetingId}.zip`;
				saveAs(blob, fileName);
				showFinalMessage("done !");
			}, e => {
				showError(e);
			});
	}

	browser.runtime.onMessage.addListener((message) => {
		if (message.command === "download-bbb") {
			handleDownloadProcess(message.downloadSelection);
		}
	});
})();