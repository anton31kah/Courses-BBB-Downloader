(function () {
    if (window.hasRun) {
        return;
    }
    window.hasRun = true;

    const scriptUrl = "https://raw.githubusercontent.com/anton31kah/Courses-BBB-Downloader/master/resources/create_lecture.ps1";

    function fetchDownloadItems(downloadSelection) {
        if (downloadSelection === "script") {
            return scriptUrl;
        }

        if (downloadSelection === "audio") {
            const audioElement = document.querySelector("source[src$='webcams.webm']");
            return audioElement?.src;
        }

        if (downloadSelection === "video") {
            const videoElement = document.querySelector("source[src$='deskshare.webm']");
            return videoElement?.src
        }

        if (downloadSelection === "slides") {
            let slidesElements = document.getElementsByClassName("slide");
            const slides = [];
            for (const slideElement of slidesElements) {
                let start = parseFloat(slideElement.getAttribute("in"));
                let end = parseFloat(slideElement.getAttribute("out"));
                let slideUrl = `${window.location.protocol}//${window.location.host}${slideElement.href.baseVal}`;
                slides.push({
                    url: slideUrl,
                    start: start,
                    end: end
                });
            }
            return slides;
        }
    }

    function urlToPromise(url) {
        return new Promise((resolve, reject) =>
            JSZipUtils.getBinaryContent(url, {
                callback: (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                }
            })
        );
    }

    function handleDownloadProcess(downloadSelection) {
        let downloadItem = fetchDownloadItems(downloadSelection);

        if (downloadSelection === "script") {
            console.log(`Will download ${downloadItem}`);
            saveAs(downloadItem, "create_lecture.ps1");
        }

        if (downloadSelection === "video") {
            console.log(`Will download ${downloadItem}`);
            saveAs(downloadItem, "video.webm");
        }

        if (downloadSelection === "audio") {
            console.log(`Will download ${downloadItem}`);
            saveAs(downloadItem, "audio.webm");
        }

        if (downloadSelection === "slides") {
            let zip = new JSZip();
            let slidesFolder = zip.folder("slides");
            let timesFileContent = [];
            for (const [index, slide] of downloadItem.entries()) {
                slidesFolder.file(`slide-${index}.png`, urlToPromise(slide.url), {binary: true});
                timesFileContent.push(`${slide.start}-${slide.end}`);
            }
            timesFileContent = timesFileContent.join("\n");
            zip.file("slides-times.txt", timesFileContent);
            zip.generateAsync({type: "blob"})
                .then(blob => saveAs(blob, "slides.zip"));
        }
    }

    function checkExists(elementName) {
        if (elementName === "script") {
            return true;
        }

        if (elementName === "audio") {
            const audioElement = document.querySelector("source[src$='webcams.webm']");
            return audioElement !== null;
        }

        if (elementName === "video") {
            const videoElement = document.querySelector("source[src$='deskshare.webm']");
            return videoElement !== null;
        }

        if (elementName === "slides") {
            const slidesElements = document.getElementsByClassName("slide");
            return slidesElements.length > 0;
        }
    }

    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.command === "cbd-download-bbb") {
            handleDownloadProcess(message.downloadSelection);
        }
        if (message.command === "cdb-check-exists") {
            sendResponse(checkExists(message.elementToCheck));
        }
    });
})();