@echo off
echo ========================================
echo   BigMinds Backend Server Starter
echo ========================================
echo.

REM Check if .env exists
if not exist ".env" (
    echo [ERROR] .env file not found!
    echo Please create a .env file with your configuration or copy .env.example
    pause
    exit /b 1
)

echo [1/3] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    pause
    exit /b 1
)
echo        Node.js is installed

echo.
echo [2/3] Checking MongoDB connection...
node check-server.js
if errorlevel 1 (
    echo.
    echo [ERROR] Server check failed!
    echo Please fix the issues above before starting the server.
    pause
    exit /b 1
)

echo.
echo [3/3] Starting backend server...
echo.
echo ========================================
echo   Server is starting...
echo   Press Ctrl+C to stop the server
echo ========================================
echo.

npm start

pause
