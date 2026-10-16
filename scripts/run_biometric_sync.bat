@echo off
title Skyland Attendance Portal — Biometric Bridge Agent
echo =================================================================
echo   SKYLAND ENERGY - BIOMETRIC DEVICE LAN SYNC
echo =================================================================
echo.
python scripts\dahua_bridge.py
if errorlevel 1 (
    echo.
    echo [!] Python is not installed or returned an error.
    echo Please make sure Python is installed and added to PATH.
    pause
)
