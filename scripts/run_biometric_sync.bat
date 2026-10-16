@echo off
title Skyland Attendance Portal — Dahua Biometric Native NetSDK Sync
echo =================================================================
echo   SKYLAND ENERGY - DAHUA DHI-ASA1222GL-D LIVE NETSDK SYNC
echo =================================================================
echo.

set PYTHON_CMD=python
where python >nul 2>nul
if errorlevel 1 (
    if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" (
        set PYTHON_CMD="%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
    )
)

echo [*] Connecting to Dahua terminal (192.168.100.110:37777)...
echo.

%PYTHON_CMD% -u scripts\dahua_live_listener.py %*
if errorlevel 1 (
    echo.
    echo [!] NetSDK Bridge encountered an error.
    pause
)
