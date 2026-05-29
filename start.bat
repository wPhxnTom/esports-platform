@echo off
title Esports Platform

echo ========================================
echo   Starting Esports Platform...
echo ========================================

set ROOT=%~dp0

echo [1/2] Starting Backend (port 3000)...
start "Backend" cmd /c "cd /d "%ROOT%backend" && npx tsx src/index.ts"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend (port 8082)...
start "Frontend" cmd /c "cd /d "%ROOT%mobile" && npx expo start --web"

echo.
echo ========================================
echo   Backend  : http://localhost:3000
echo   Frontend : http://localhost:8082
echo ========================================
echo.
pause
