@echo off
title Voynich Codex - Stop
echo.
echo Stopping Docker services...
docker-compose down
echo.
echo All services stopped.
pause
