@echo off
setlocal

cd /d "%~dp0"

echo ========================================
echo Journalism Toolbox - Development Runner
echo ========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js is not installed or is not available in PATH.
  echo Install Node.js, then run this file again.
  pause
  exit /b 1
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm.cmd is not available in PATH.
  echo Reinstall Node.js, then run this file again.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Installing dependencies...
  npm.cmd install
  if errorlevel 1 (
    echo.
    echo [ERROR] Dependency installation failed.
    pause
    exit /b 1
  )
)

if not exist "whisper\\Runtime\\whisper-local.cmd" (
  echo [WARN] whisper\\Runtime\\whisper-local.cmd was not found.
  echo Run install-whisper-local.ps1 first.
  echo.
)

if not exist "whisper\\Models\\large-v2.pt" (
  echo [WARN] whisper\\Models\\large-v2.pt was not found.
  echo Put the local Whisper Large V2 model in that folder.
  echo.
)

echo.
echo Runtime notes:
echo - Whisper runtime: whisper\\Runtime\\whisper-local.cmd
echo - Whisper model:   whisper\\Models\\large-v2.pt
echo - Saved texts:     whisper\\Transcriptions
echo - Ollama v1:       http://127.0.0.1:11434/v1
echo.
echo Starting app...
echo.

npm.cmd run dev

echo.
echo App closed.
pause
