@echo off
chcp 65001 > nul
echo 🚀 Starting Beetle Backend in stable mode...
echo 📝 This mode prevents server restarts during OAuth
echo.

:: Kill any existing node processes on port 3001
echo 🔄 Cleaning up existing processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do taskkill /PID %%a /F
timeout /t 2 >nul

:: Start the backend without nodemon
echo ✅ Starting backend server...
node src/index.cjs
