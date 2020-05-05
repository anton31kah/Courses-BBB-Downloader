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

	function prepareDownloadProgress() {
		let downloadStatus = $('body > #download-status');

		if (downloadStatus.length === 1) {
			downloadStatus.remove();
		}

		$('body').prepend(`
			<div id="download-status">
				<div class="progress hide" id="progress_bar">
					<div class="progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
				</div>

				<p class="" id="result">Download process will start soon!</p>
			</div>
			`);

		downloadStatus = $('body > #download-status');
	}

	function resetMessage() {
		$("#result")
			.removeClass()
			.text("");
	}

	function showMessage(text) {
		resetMessage();
		$("#result")
			.addClass("alert alert-success")
			.text(text);
	}

	function showError(text) {
		resetMessage();
		$("#result")
			.addClass("alert alert-danger")
			.text(text);
	}

	function updatePercent(percent) {
		$("#progress_bar").removeClass("hide")
			.find(".progress-bar")
			.attr("aria-valuenow", percent)
			.css({
				width: percent + "%"
			});
	}

	function urlToPromise(url) {
		return new Promise(function (resolve, reject) {
			JSZipUtils.getBinaryContent(url, function (err, data) {
				if (err) {
					reject(err);
				} else {
					resolve(data);
				}
			});
		});
	}

	function urlTextContent(url) {
		return fetch(url).then(data => data.text());
	}

	function handleDownloadProcess(downloadSelection) {
		let downloadQueue = fetchDownloadItems(downloadSelection);

		prepareDownloadProgress();

		let zip = new JSZip();

		zip.file('create_lecture.ps1', urlTextContent(downloadSelection.scriptUrl), {binary: true})

		if (downloadQueue.video) {
			zip.file('video.webm', urlToPromise(downloadQueue.video), { binary: true });
		}

		if (downloadQueue.audio) {
			zip.file('audio.webm', urlToPromise(downloadQueue.audio), { binary: true });
		}

		if (downloadQueue.slides) {
			let slidesFolder = zip.folder('slides');
			let timesFileContent = [];
			for (const [index, slide] of downloadQueue.slides.entries()) {
				slidesFolder.file(`slide-${index}.png`, urlToPromise(slide.url), { binary: true });
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
			updatePercent(metadata.percent | 0);
		})
			.then(blob => {
				let lectureTitle = $('#recording-title').text();
				let meetingId = downloadSelection.meetingId;
				let fileName = `${lectureTitle}-${meetingId}.zip`;
				saveAs(blob, fileName);
				showMessage("done !");
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