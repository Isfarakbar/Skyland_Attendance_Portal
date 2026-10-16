@echo off
title Skyland Attendance Portal — Biometric Bridge Agent
echo =================================================================
echo   SKYLAND ENERGY - DAHUA BIOMETRIC DEVICE LAN SYNC
echo =================================================================
echo.

set PYTHON_CMD=python
where python >nul 2>nul
if errorlevel 1 (
    if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" (
        set PYTHON_CMD="%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
    )
)

echo [*] Starting Dahua Biometric LAN Bridge...
echo.

%PYTHON_CMD% scripts\dahua_bridge.py %*
if errorlevel 1 (
    echo.
    echo [*] Python exited or returned an error. Falling back to native Node.js bridge...
    node scripts\dahua_bridge.js %*
)

pause
