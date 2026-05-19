@echo off
setlocal

cd /d "%~dp0"

echo Starting BTC FIRE OS...
echo.

if not exist "node_modules" (
  echo Dependencies are missing. Running npm install first...
  call npm install
  if errorlevel 1 (
    echo.
    echo npm install failed. Please check Node.js and npm.
    pause
    exit /b 1
  )
)

start "BTC FIRE OS Dev Server" /D "%~dp0" cmd /k "npm run dev"

echo Waiting for the local server...
timeout /t 4 /nobreak >nul

start "" "http://localhost:3000"

echo.
echo BTC FIRE OS is starting.
echo If the browser does not load immediately, wait a few seconds and refresh.
echo If port 3000 is already busy, check the dev server window for the Local URL.
echo.
pause
