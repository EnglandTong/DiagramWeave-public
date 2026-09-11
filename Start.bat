@echo off
title DiagramWeave - Start Server

cd /d "%~dp0"

echo ========================================
echo   DiagramWeave Quick Start
echo ========================================
echo.

echo [1/3] Building project...
call npm run build
if errorlevel 1 (
    echo.
    echo [ERROR] Build failed. Check output above.
    pause
    exit /b 1
)
echo.

echo [2/3] Detecting LAN IP...
set LAN_IP=
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    for /f "tokens=* delims= " %%b in ("%%a") do (
        echo %%b | findstr /b "192.168." >nul
        if not errorlevel 1 set LAN_IP=%%b
        echo %%b | findstr /b "10." >nul
        if not errorlevel 1 set LAN_IP=%%b
        echo %%b | findstr /b "172.16." >nul
        if not errorlevel 1 set LAN_IP=%%b
    )
)
echo.

echo [3/3] Starting server...
echo ========================================
if defined LAN_IP (
    echo   Local:    http://localhost:4173/
    echo   LAN:      http://%LAN_IP%:4173/
    echo   (iPad on same WiFi can use the LAN URL)
) else (
    echo   Local:    http://localhost:4173/
    echo   (Run "ipconfig" to find your LAN IP)
)
echo ========================================
echo.
echo Press Ctrl+C to stop
echo.

call npm run serve

pause
