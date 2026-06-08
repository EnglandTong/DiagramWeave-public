@echo off
cd /d "%~dp0"
title DiagramWeave

set "DIAGRAMWEAVE_URL=http://127.0.0.1:4173/flowchart-editor.html"

echo.
echo DiagramWeave - preparing environment...
echo URL: %DIAGRAMWEAVE_URL%
echo Close this window to stop the service started by this window.
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js was not found.
  echo Please install Node.js 18+ first: https://nodejs.org/
  echo Then run this file again.
  echo.
  where winget >nul 2>&1
  if errorlevel 1 (
    echo winget is not available. Please install Node.js manually.
    goto :end
  )
  choice /C YN /M "Try installing Node.js LTS with winget"
  if errorlevel 2 goto :end
  winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
  echo Please close and reopen this window after installation.
  goto :end
)

node "%~dp0scripts\setup.mjs"
if errorlevel 1 goto :end

if not "%DIAGRAMWEAVE_NO_OPEN%"=="1" (
  start "" cmd /c "ping -n 2 127.0.0.1>nul & start "" "%DIAGRAMWEAVE_URL%""
)

node "%~dp0scripts\serve.mjs"

:end
pause
