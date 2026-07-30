@echo off
echo =======================================================
echo    MedShield Twin: Launching Smart Hospital System
echo =======================================================
echo.

echo [1/5] Installing Python PIP Dependencies...
pip install flask flask-cors flask-login bcrypt scikit-learn pandas scapy reportlab
if %errorlevel% neq 0 (
    echo Failed to install Python dependencies. Please check your internet connection.
    pause
    exit /b %errorlevel%
)
echo.

echo [2/5] Initializing SQLite Database ^& Seeding Devices...
python -u database/db_manager.py
if %errorlevel% neq 0 (
    echo Database initialization failed.
    pause
    exit /b %errorlevel%
)
echo.

echo [3/5] Training Random Forest Machine Learning Model...
python -u machine_learning/train.py
if %errorlevel% neq 0 (
    echo Model training failed.
    pause
    exit /b %errorlevel%
)
echo.

echo [4/5] Spawning Python Flask Backend (Port 5000)...
start "MedShield Backend (Flask)" cmd /k "python -u backend/app.py"
echo.

echo [5/5] Building Frontend React Environment...
cd frontend
if not exist node_modules (
    echo node_modules folder missing. Running npm install...
    call npm.cmd install
)
echo.

echo Spawning Vite React UI Server (Port 5173)...
start "MedShield Frontend (Vite)" cmd /k "npm.cmd run dev"
echo.
cd ..

echo =======================================================
echo    MedShield Twin services launched successfully!
echo    - Flask API Service: http://localhost:5000
echo    - React Dashboard UI: http://localhost:5173
echo =======================================================
echo.
pause
