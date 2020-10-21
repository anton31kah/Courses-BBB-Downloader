[CmdletBinding()]
Param (
	[Parameter(Mandatory = $true, ParameterSetName = "Slides")]
	[switch]
	$slidesAndAudio,

	[Parameter(Mandatory = $true, ParameterSetName = "Video")]
	[switch]
	$videoAndAudio,

	[Parameter(Mandatory = $true, ParameterSetName = "Clean")]
	[switch]
	$cleanUp,

	[Parameter()]
	[switch]
	$deleteRest = $false
)

[Environment]::CurrentDirectory = (Get-Location -PSProvider FileSystem).ProviderPath

if ($slidesAndAudio) {
	$missingFiles = (-Not [System.IO.File]::Exists("audio.webm")) -or
					(-Not [System.IO.File]::Exists("slides.zip"))

	if ($missingFiles) {
		throw "Not all needed files are here (audio.webm, slides.zip)"
	}

	Expand-Archive .\slides.zip -DestinationPath .

	$missingFiles = (-Not [System.IO.Directory]::Exists("slides")) -or
                    (-Not [System.IO.File]::Exists("slides-times.txt"))

    if ($missingFiles) {
        throw "Not all needed files are here (slides, slides-times.txt)"
    }

	$res = ffprobe -i .\audio.webm -show_format -v quiet | Select-String -Pattern duration
	$maxDuration = [double]::Parse($res.Line.Split("=")[1])

	$durations = Get-Content .\slides-times.txt | ForEach-Object {
		$parts = $_.Split("-")
		$from = [double]::Parse($parts[0])
		$to = [double]::Parse($parts[1])
		$to = [Math]::Min($to, $maxDuration)
		$duration = $to - $from
		return [string]::Format("{0:0.#}", $duration)
	}

	$slides = Get-ChildItem .\slides | ForEach-Object {
		return "slides/$($_.Name)"
	}

	$durationsAndFiles = [System.Linq.Enumerable]::Zip($durations, $slides, [Func[object, object, object]] {
		param($duration, $file)
		return [Tuple]::Create($duration, $file)
	})

	New-Item -Path . -Name "slides.txt" -ItemType "file" -Force

	$durationsAndFiles | ForEach-Object {
		$tuple = [Tuple[string, string]]($_)
		$duration = $tuple.Item1
		$slide = $tuple.Item2
		$slideVideoName = $slide.Replace("png", "mp4")
		Add-Content -Path "slides.txt" -Value "file $slideVideoName"
		ffmpeg -loop 1 -framerate 1 -i $slide -t $duration $slideVideoName
	}

	ffmpeg -f concat -i .\slides.txt slides.mp4

	ffmpeg -i slides.mp4 -i audio.webm -c:v copy -map 0:v:0 -map 1:a:0 whole.mp4
}

if ($videoAndAudio) {
	$missingFiles = (-Not [System.IO.File]::Exists("audio.webm")) -or
					(-Not [System.IO.File]::Exists("video.webm"))

	if ($missingFiles) {
		throw "Not all needed files are here (audio.webm, video.webm)"
	}

	ffmpeg -i video.webm -i audio.webm -c:v copy -map 0:v:0 -map 1:a:0 whole.mp4
}

if ($cleanUp -or $deleteRest) {
	$filesToDelete = ("slides", "audio.webm", "slides.mp4", "slides.txt", "slides-times.txt", "slides.zip", "video.webm")
	Remove-Item $filesToDelete -Recurse -ErrorAction Ignore
}