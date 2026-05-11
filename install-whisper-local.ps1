$ErrorActionPreference = 'Stop'

$root = 'C:\Users\ANA-VP\Desktop\Journalism Toolbox\whisper'
$pythonHome = Join-Path $root 'python'
$runtimeRoot = Join-Path $root 'Runtime'
$venvRoot = Join-Path $runtimeRoot 'venv'
$ffmpegRoot = Join-Path $runtimeRoot 'ffmpeg'
$modelRoot = Join-Path $root 'Models'
$transcriptionsRoot = Join-Path $root 'Transcriptions'
$tmpRoot = Join-Path $root 'tmp'

$pythonVersion = '3.11.9'
$pythonInstallerUrl = "https://www.python.org/ftp/python/$pythonVersion/python-$pythonVersion-amd64.exe"
$getPipUrl = 'https://bootstrap.pypa.io/get-pip.py'
$ffmpegZipUrl = 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip'

New-Item -ItemType Directory -Force -Path $root, $pythonHome, $runtimeRoot, $ffmpegRoot, $modelRoot, $transcriptionsRoot, $tmpRoot | Out-Null

$pythonInstaller = Join-Path $tmpRoot "python-$pythonVersion-amd64.exe"
$getPipPath = Join-Path $tmpRoot 'get-pip.py'
$ffmpegZipPath = Join-Path $tmpRoot 'ffmpeg-release-essentials.zip'
$ffmpegExtractPath = Join-Path $tmpRoot 'ffmpeg-extract'

Write-Host 'Downloading local Python installer...'
Invoke-WebRequest -Uri $pythonInstallerUrl -OutFile $pythonInstaller

Write-Host 'Installing Python into local whisper folder...'
& $pythonInstaller `
  /quiet `
  TargetDir="$pythonHome" `
  InstallAllUsers=0 `
  PrependPath=0 `
  Include_pip=1 `
  Include_test=0 `
  Include_tcltk=0 `
  Include_doc=0 `
  Include_launcher=0 `
  Include_dev=0 `
  Include_debug=0 `
  AssociateFiles=0 `
  CompileAll=0 `
  Shortcuts=0 `
  SimpleInstall=1

$pythonExe = Join-Path $pythonHome 'python.exe'
if (-not (Test-Path $pythonExe)) {
  throw "Local python.exe was not created at $pythonExe"
}

Write-Host 'Creating isolated venv...'
& $pythonExe -m venv $venvRoot

$venvPython = Join-Path $venvRoot 'Scripts\python.exe'
$venvPip = Join-Path $venvRoot 'Scripts\pip.exe'
if (-not (Test-Path $venvPython)) {
  throw "Local venv python was not created at $venvPython"
}

Write-Host 'Upgrading pip tooling in local venv...'
& $venvPython -m pip install --upgrade pip setuptools wheel setuptools-rust

Write-Host 'Installing Whisper into local venv...'
& $venvPython -m pip install --upgrade openai-whisper

Write-Host 'Downloading local FFmpeg build...'
Invoke-WebRequest -Uri $ffmpegZipUrl -OutFile $ffmpegZipPath

if (Test-Path $ffmpegExtractPath) {
  Remove-Item -Recurse -Force $ffmpegExtractPath
}

Expand-Archive -Path $ffmpegZipPath -DestinationPath $ffmpegExtractPath -Force

$ffmpegBin = Get-ChildItem -Path $ffmpegExtractPath -Recurse -Filter ffmpeg.exe | Select-Object -First 1
$ffprobeBin = Get-ChildItem -Path $ffmpegExtractPath -Recurse -Filter ffprobe.exe | Select-Object -First 1
$ffplayBin = Get-ChildItem -Path $ffmpegExtractPath -Recurse -Filter ffplay.exe | Select-Object -First 1

if (-not $ffmpegBin) {
  throw 'ffmpeg.exe was not found in the downloaded archive.'
}

Copy-Item $ffmpegBin.FullName (Join-Path $ffmpegRoot 'ffmpeg.exe') -Force
if ($ffprobeBin) {
  Copy-Item $ffprobeBin.FullName (Join-Path $ffmpegRoot 'ffprobe.exe') -Force
}
if ($ffplayBin) {
  Copy-Item $ffplayBin.FullName (Join-Path $ffmpegRoot 'ffplay.exe') -Force
}

$wrapperPath = Join-Path $runtimeRoot 'whisper-local.cmd'
$wrapperContent = @"
@echo off
setlocal
set "SCRIPT_DIR=%~dp0"
set "PATH=%SCRIPT_DIR%ffmpeg;%SCRIPT_DIR%venv\Scripts;%PATH%"
"%SCRIPT_DIR%venv\Scripts\python.exe" -m whisper %*
"@
Set-Content -Path $wrapperPath -Value $wrapperContent -Encoding ASCII

Write-Host ''
Write-Host 'Whisper local install completed.'
Write-Host "Python:  $pythonExe"
Write-Host "Venv:    $venvRoot"
Write-Host "Wrapper: $wrapperPath"
Write-Host "FFmpeg:  $ffmpegRoot"
Write-Host "Models:  $modelRoot"
Write-Host "Texts:   $transcriptionsRoot"
