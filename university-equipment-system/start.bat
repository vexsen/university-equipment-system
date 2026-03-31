@echo off
echo Starting University Equipment Borrowing System...
echo.

start "Backend API" cmd /k "cd backend && npm run dev"
timeout /t 2 /nobreak >nul
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are starting:
echo   Backend API: http://localhost:5000
echo   Frontend:    http://localhost:5173
echo.
echo Default login credentials:
echo   Admin:   admin@university.edu / admin123
echo   Student: student@university.edu / student123
echo.
pause
