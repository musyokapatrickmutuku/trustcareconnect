@echo off
setlocal enabledelayedexpansion

REM TrustCareConnect Local Deployment Script (Windows)
echo.
echo 🚀 Starting TrustCareConnect Local Deployment...
echo ===============================================
echo.

REM Check prerequisites
echo [INFO] Checking prerequisites...

where dfx >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] dfx is not installed. Please install the Internet Computer SDK.
    echo Visit: https://internetcomputer.org/docs/current/developer-docs/setup/install/
    pause
    exit /b 1
)

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 16+.
    echo Visit: https://nodejs.org/
    pause
    exit /b 1
)

where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed. Please install npm.
    pause
    exit /b 1
)

echo [SUCCESS] All prerequisites found
for /f "tokens=*" %%i in ('dfx --version') do echo   - dfx: %%i
for /f "tokens=*" %%i in ('node --version') do echo   - node: %%i
for /f "tokens=*" %%i in ('npm --version') do echo   - npm: %%i
echo.

REM Start dfx replica
echo [INFO] Starting local ICP replica...
dfx stop >nul 2>nul
dfx start --background --clean

echo [INFO] Waiting for replica to be ready...
timeout /t 5 /nobreak >nul

dfx ping >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to start ICP replica
    pause
    exit /b 1
)

echo [SUCCESS] ICP replica is running
echo.

REM Deploy canisters
echo [INFO] Deploying backend canister...
dfx deploy backend

echo [INFO] Installing frontend dependencies...
cd src\frontend
call npm install --silent
cd ..\..

echo [INFO] Deploying frontend canister...
dfx deploy frontend

echo [SUCCESS] Canisters deployed successfully
echo.

REM Setup AI proxy
echo [INFO] Setting up AI proxy server...
cd ai-proxy

if not exist node_modules (
    echo [INFO] Installing AI proxy dependencies...
    call npm install --silent
)

if not exist .env (
    echo [INFO] Creating .env file...
    copy .env.example .env >nul
    echo [WARNING] Using mock AI responses. Edit ai-proxy\.env to add real API keys.
)

cd ..
echo [SUCCESS] AI proxy setup complete
echo.

REM Test deployment
echo [INFO] Testing deployment...

dfx canister call backend healthCheck >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Backend test failed
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('dfx canister id backend') do set backend_id=%%i
for /f "tokens=*" %%i in ('dfx canister id frontend') do set frontend_id=%%i

echo [SUCCESS] Backend is responding
echo.

REM Start AI proxy
echo [INFO] Starting AI proxy server...
cd ai-proxy

REM Kill any existing process on port 3001 (Windows version)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001') do (
    taskkill /F /PID %%a >nul 2>nul
)

REM Start AI proxy in background
start /B cmd /c "npm start > ai-proxy.log 2>&1"

echo [INFO] Waiting for AI proxy to start...
timeout /t 3 /nobreak >nul

curl -s http://localhost:3001/api/health >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] AI proxy may not have started correctly
    echo Check ai-proxy\ai-proxy.log for details
) else (
    echo [SUCCESS] AI proxy server started
)

cd ..
echo.

REM Show results
echo.
echo 🎉 TrustCareConnect is now running locally!
echo ===========================================
echo.
echo 📋 Your application URLs:
echo   🖥️  Frontend: http://%frontend_id%.localhost:4943
echo   ⚙️  Backend Candid UI: http://%backend_id%.localhost:4943/_/candid
echo   🤖 AI Proxy: http://localhost:3001
echo.
echo 📋 Quick Testing Steps:
echo 1. Open Frontend URL above
echo 2. Register a Doctor (Doctor View)
echo 3. Register a Patient (Patient View)
echo 4. Doctor assigns Patient (Patient Management tab)
echo 5. Patient submits Query (generates AI draft)
echo 6. Doctor reviews Query with AI assistance
echo 7. Doctor submits final response
echo.
echo 📖 Full Testing Guide: See DEPLOYMENT_GUIDE.md
echo.
echo 🛑 To Stop Everything:
echo   dfx stop
echo   Close this command window
echo.
echo 🔧 Troubleshooting:
echo   - Backend logs: dfx logs backend
echo   - AI proxy logs: type ai-proxy\ai-proxy.log
echo   - Frontend: F12 in browser
echo.

echo Press any key to keep services running...
pause >nul