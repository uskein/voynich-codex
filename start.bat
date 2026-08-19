@echo off
title Voynich Codex - Development
echo.
echo ============================================
echo   VOYNICH CODEX - Starting Development
echo ============================================
echo.

echo [1/3] Starting Docker services...
docker-compose up -d
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose failed. Make sure Docker is running.
    pause
    exit /b 1
)
echo [OK] Docker services started.
echo.

echo [2/3] Waiting for services to be ready...
timeout /t 5 /nobreak >nul
echo [OK] Services ready.
echo.

echo [3/3] Starting Gateway + Backend + Frontend...
echo.
echo ============================================
echo   Gateway:  http://localhost:4000
echo   Backend:  http://localhost:3000
echo   Frontend: http://localhost:5173
echo   Qdrant:   http://localhost:6333
echo   n8n:      http://localhost:5678
echo ============================================
echo.
echo Press Ctrl+C to stop all services.
echo.

npm run dev
