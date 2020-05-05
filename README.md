# Courses BigBlueButton Recordings Downloader

## Requirements
- This extension downloads the recordings as **RAW** files.
- You need to have ffmpeg installed and added to path.
- Otherwise you'll only have raw data that you'll have to merge on your own.

## Usage
- Simply select what you want to download from the extension popup
- Wait for the zip to get ready and get downloaded.
- Don't worry, all the things are done on your machine inside your browser. If you don't trust me, check the code, it's simple.
- When downloaded, unzip it somewhere.
- Open powershell (powershell core works as well for cross platform cases) and type in one the following:

	```powershell
	.\create_lecture.ps1 -videoAndAudio [-deleteRest]
	.\create_lecture.ps1 -slidesAndAudio [-deleteRest]
	```

- Explanation:
	- `-videoAndAudio`: merges the video with the audio (use this option when downloading a lecture that used screen recording).
	- `-slidesAndAudio`: creates a video from the slides with the correct lengths, then merges it with the audio (use this option when downloading a lecture that used the typical presentations).
		- Note: this option is very slow (it took me an hour and a half to process a 90 minute lecture)
	- One of the previous two options is mandatory, both are not allowed at the same time.
	- `-deleteRest`: optional. Deletes the other unnecessary files except for the script, you'll have to delete that one on your own.

## Download
- For Firefox you can download the extension from [the releases page](https://github.com/anton31kah/Courses-BBB-Downloader/releases/download/v1.0/courses_bbb_downloader-1.0-fx.xpi).

## FFmpeg
- The project uses ffmpeg and ffprobe which you can download from [the official page](https://www.ffmpeg.org/download.html).