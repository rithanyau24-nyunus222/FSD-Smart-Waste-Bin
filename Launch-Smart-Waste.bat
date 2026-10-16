@echo off
title Smart Waste Management System
cd /d "%~dp0"
echo ======================================================
echo 🌿 SMART WASTE MANAGEMENT SYSTEM — LAUNCHER
echo ======================================================
echo Starting server and loading application...
echo ➜ Local App:            http://localhost:5000
echo ➜ Live Database Web UI: http://localhost:5000/database
echo ======================================================
npm start
pause
