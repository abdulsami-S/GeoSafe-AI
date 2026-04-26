@echo off
echo Starting GeoSafe AI...
start "Backend" cmd /k "cd backend && pip install -r requirements.txt && uvicorn app:app --host 0.0.0.0 --port 8000 --reload"
timeout /t 5
start "Frontend" cmd /k "cd frontend && npm install && npm run dev"
echo Both servers starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
pause
