@echo off
echo ================================================
echo Starting Orbia AI Service (Python)
echo ================================================
echo.

cd /d "%~dp0"

echo Checking Python installation...
python --version
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.9+
    pause
    exit /b 1
)

echo.
echo Installing dependencies (if needed)...
pip install -r requirements.txt --quiet

echo.
echo Starting FastAPI server on port 8000...
echo Press Ctrl+C to stop
echo.

python app/main.py

pause
