@echo off
echo ===================================================
echo   CITYTWIN — Smart City Simulation Platform
echo ===================================================
echo Starting FastAPI Backend and React Vite Frontend...

start "CITYTWIN Backend (FastAPI)" cmd /k ".\.venv\Scripts\python.exe backend\run.py"
start "CITYTWIN Frontend (Vite)" cmd /k "npm.cmd --prefix frontend run dev"

echo.
echo Services launched:
echo  - Frontend Dashboard: http://localhost:5173
echo  - Backend API Docs:   http://127.0.0.1:8000/docs
echo  - Health Check:       http://127.0.0.1:8000/api/health
echo ===================================================
