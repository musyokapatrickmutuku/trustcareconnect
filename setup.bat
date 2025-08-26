@echo off
REM TrustCareConnect - Windows Automated Setup Script
REM This batch file provides automated setup for Windows users

echo.
echo ================================================== 
echo 🏥 TrustCareConnect - Windows Setup
echo ==================================================
echo.

echo 🔍 CHECKING PREREQUISITES...
echo.

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found. Please install Node.js 16+ from https://nodejs.org/
    echo.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo ✅ Node.js found: %NODE_VERSION%
)

REM Check npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm not found. Please install npm.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo ✅ npm found: %NPM_VERSION%
)

REM Check DFX
dfx --version >nul 2>&1
if errorlevel 1 (
    echo ❌ DFX not found. Please install DFX from:
    echo    https://internetcomputer.org/docs/current/developer-docs/setup/install/
    echo.
    echo For Windows, you need WSL (Windows Subsystem for Linux):
    echo 1. Install WSL: wsl --install
    echo 2. Install DFX in WSL: sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
    echo 3. Run this setup from WSL
    echo.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('dfx --version') do set DFX_VERSION=%%i
    echo ✅ DFX found: %DFX_VERSION%
)

echo.
echo ✅ All prerequisites satisfied!
echo.

echo 📦 INSTALLING DEPENDENCIES...
npm install --legacy-peer-deps
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo ✅ Dependencies installed successfully
echo.

echo 🔧 STARTING DFX REPLICA...
dfx ping >nul 2>&1
if errorlevel 1 (
    echo Starting DFX replica...
    dfx start --background --clean
    timeout /t 5 /nobreak >nul
) else (
    echo ✅ DFX replica is already running
)
echo.

echo 🚀 DEPLOYING BACKEND CANISTER...
dfx deploy backend
if errorlevel 1 (
    echo ❌ Failed to deploy backend canister
    pause
    exit /b 1
)

REM Get canister ID
for /f "tokens=*" %%i in ('dfx canister id backend') do set CANISTER_ID=%%i
echo ✅ Backend deployed: %CANISTER_ID%
echo.

echo ⚙️ CONFIGURING ENVIRONMENT...
(
echo NODE_ENV=development
echo REACT_APP_IC_HOST=http://127.0.0.1:4943
echo REACT_APP_BACKEND_CANISTER_ID=%CANISTER_ID%
echo CANISTER_ID_BACKEND=%CANISTER_ID%
echo REACT_APP_NETWORK=local
echo DFX_NETWORK=local
echo REACT_APP_DEBUG_MODE=true
) > .env

if not exist packages\frontend mkdir packages\frontend
(
echo REACT_APP_IC_HOST=http://127.0.0.1:4943
echo REACT_APP_BACKEND_CANISTER_ID=%CANISTER_ID%
echo REACT_APP_CANISTER_ID=%CANISTER_ID%
echo REACT_APP_NETWORK=local
echo REACT_APP_DEBUG_MODE=true
echo NODE_ENV=development
) > packages\frontend\.env.local

echo ✅ Environment configured
echo.

echo 🧪 LOADING TEST DATA...
echo Registering doctors and patients...

REM Register doctors (simplified for batch file)
dfx canister call backend registerDoctor "(\"Dr. Maria Elena Rodriguez\", \"Endocrinology\")" >nul 2>&1
dfx canister call backend registerDoctor "(\"Dr. James Michael Thompson\", \"Endocrinology\")" >nul 2>&1

REM Register patients (simplified for batch file)  
dfx canister call backend registerPatient "(\"Sarah Michelle Johnson\", \"Diabetes Type 2\", \"sarah.johnson@email.com\")" >nul 2>&1
dfx canister call backend registerPatient "(\"Michael David Rodriguez\", \"Diabetes Type 1\", \"mike.rodriguez@student.edu\")" >nul 2>&1
dfx canister call backend registerPatient "(\"Carlos Eduardo Mendoza\", \"Diabetes Type 2\", \"carlos.mendoza@gmail.com\")" >nul 2>&1

echo ✅ Test data loaded
echo.

echo 🌐 STARTING FRONTEND...
echo The frontend will start in a new window...
start "TrustCareConnect Frontend" cmd /k "npm start"
echo ✅ Frontend starting...
echo.

echo ==================================================
echo 🎉 SETUP COMPLETE!
echo ==================================================
echo.
echo 🌐 Application URL: http://localhost:3000
echo 📚 Documentation: See README.md and TEST-CREDENTIALS.md
echo.
echo 👥 PATIENT TEST ACCOUNTS:
echo.
echo 1. Sarah Michelle Johnson (Type 2 Diabetes)
echo    📧 sarah.johnson@email.com
echo    🔑 SarahDiabetes2024!
echo.
echo 2. Michael David Rodriguez (Type 1 Diabetes)  
echo    📧 mike.rodriguez@student.edu
echo    🔑 MikeType1Diabetes!
echo.
echo 3. Carlos Eduardo Mendoza (Type 2 Diabetes)
echo    📧 carlos.mendoza@gmail.com  
echo    🔑 CarlosType2_2024!
echo.
echo 👨‍⚕️ DOCTOR TEST ACCOUNTS:
echo.
echo 1. Dr. Maria Elena Rodriguez (Endocrinology)
echo    📧 dr.rodriguez@trustcare.com
echo    🔑 DrMaria2024Endo!
echo.
echo 2. Dr. James Michael Thompson (Endocrinology)
echo    📧 dr.thompson@trustcare.com
echo    🔑 DrJames2024Endo!
echo.
echo 📝 NEXT STEPS:
echo 1. Wait 2-3 minutes for frontend compilation
echo 2. Open http://localhost:3000 in your browser
echo 3. Use any credentials above to login and test!
echo.
echo Happy testing! 🚀
echo.
pause