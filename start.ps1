Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  CITYTWIN — Smart City Simulation Platform" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "Starting FastAPI Backend and React Vite Frontend..."

Start-Process powershell -ArgumentList "-NoExit", "-Command", ".\.venv\Scripts\python.exe backend\run.py"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cmd.exe /c 'npm.cmd --prefix frontend run dev'"

Write-Host ""
Write-Host "Services launched:" -ForegroundColor Green
Write-Host " - Frontend Dashboard: http://localhost:5173" -ForegroundColor Green
Write-Host " - Backend API Docs:   http://127.0.0.1:8000/docs" -ForegroundColor Green
Write-Host " - Health Check:       http://127.0.0.1:8000/api/health" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan
