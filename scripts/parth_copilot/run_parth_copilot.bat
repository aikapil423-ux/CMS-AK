@echo off
title Parth AI Police Copilot Server - CMS Web Edition
cd /d "%~dp0"

echo ========================================================
echo   Starting Parth AI Police Copilot Server (CMS AK)
echo   FastAPI + WebSocket on http://127.0.0.1:8000
echo ========================================================

python web_server.py
pause
