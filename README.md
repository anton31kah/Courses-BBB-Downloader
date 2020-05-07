# Courses BigBlueButton Recordings Downloader

## Requirements
- This extension downloads the recordings as **RAW** files.
- You need to have ffmpeg installed and added to path, otherwise you'll only have raw data that you'll have to merge on your own.

## Usage
- Simply select what you want to download from the extension popup.
- Wait for the zip to get ready and then download it.
- Don't worry, everything is done on your machine inside your browser. If you don't trust me, check the code, it's simple.
- When downloaded, unzip it anywhere you like.
- Open powershell inside that directory and type in one the following:

	```powershell
	.\create_lecture.ps1 -videoAndAudio [-deleteRest]
	.\create_lecture.ps1 -slidesAndAudio [-deleteRest]
	```

	- Note: [Powershell Core](https://github.com/PowerShell/Powershell) works as well for cross platform cases.

- Explanation:
	- `-videoAndAudio`: merges the video with the audio. Use this option when downloading a lecture that used screen recording/sharing.
	- `-slidesAndAudio`: creates a video from the slides with the correct lengths, then merges it with the audio. Use this option when downloading a lecture that used the typical presentations).
		- Note: this option is very slow (it took me an hour and a half to process a 90 minute lecture)
		- If you have any idea how to speed this up, please share it with me, either through an issue, contacting me privately, or even doing yourself in a pull request, I'll gladly test it and merge it.
	- One of the previous two options is mandatory, both are not allowed at the same time.
	- `-deleteRest`: optional. Deletes the other unnecessary files except for the script, you'll have to delete that one on your own.

## Download
- For Firefox you can download the extension from [the releases page](https://github.com/anton31kah/Courses-BBB-Downloader/releases/latest).
- Note that the extension won't appear in pages which aren't the BBB recording page.
	![Preview](https://github.com/anton31kah/Courses-BBB-Downloader/blob/master/screenshots/extension_preview.jpg "Preview")

## FFmpeg
- The project uses ffmpeg and ffprobe which you can download from [the official page](https://www.ffmpeg.org/download.html).