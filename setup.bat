@echo off
title Esports Platform - Setup

set ROOT=%~dp0

echo ========================================
echo   First-time setup
echo ========================================
echo.

echo [1/3] Installing backend dependencies...
cd /d "%ROOT%backend"
call npm install

echo [2/3] Installing frontend dependencies...
cd /d "%ROOT%mobile"
call npm install

echo [3/3] Running Prisma migration + seed...
cd /d "%ROOT%backend"
call npx prisma migrate dev --name init
call npx tsx src/seed.ts

echo.
echo ========================================
echo   Setup complete !
echo   Run start.bat to launch the app.
echo ========================================
pause
