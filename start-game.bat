@echo off
setlocal
cd /d "%~dp0"

set "PYTHON="
if exist "%~dp0.venv\Scripts\python.exe" (
    "%~dp0.venv\Scripts\python.exe" --version >nul 2>&1
    if not errorlevel 1 set "PYTHON=%~dp0.venv\Scripts\python.exe"
)

if not defined PYTHON (
    where py >nul 2>&1
    if not errorlevel 1 (
        py --version >nul 2>&1
        if not errorlevel 1 set "PYTHON=py"
    )
)

if not defined PYTHON (
    where python >nul 2>&1
    if not errorlevel 1 (
        python --version >nul 2>&1
        if not errorlevel 1 set "PYTHON=python"
    )
)

if not defined PYTHON goto :download_python
goto :start_server

:download_python
set "ARCH=%PROCESSOR_ARCHITECTURE%"
if defined PROCESSOR_ARCHITEW6432 set "ARCH=%PROCESSOR_ARCHITEW6432%"
if /i "%ARCH%"=="AMD64" goto :amd64
if /i "%ARCH%"=="ARM64" goto :arm64
if /i "%ARCH%"=="x86" goto :win32

echo Automatic Python download is not configured for architecture "%ARCH%".
echo Install Python manually and run this file again.
pause
exit /b 1

:amd64
set "PYTHON_ARCH=amd64"
set "PYTHON_URL=https://www.python.org/ftp/python/3.14.10/python-3.14.10-embed-amd64.zip"
set "PYTHON_SHA256=90905e64a840557d8c1bc4f5b74db3d7ee85e3ffb217611cac1c7813acea4159"
goto :download_runtime

:arm64
set "PYTHON_ARCH=arm64"
set "PYTHON_URL=https://www.python.org/ftp/python/3.14.10/python-3.14.10-embed-arm64.zip"
set "PYTHON_SHA256=bbe116bb1248820359cbf25127ac5c7794ea161869d83686cfbc9a45203ff836"
goto :download_runtime

:win32
set "PYTHON_ARCH=win32"
set "PYTHON_URL=https://www.python.org/ftp/python/3.14.10/python-3.14.10-embed-win32.zip"
set "PYTHON_SHA256=11a28e8c00a6d8f56b0a6164d52546133a9ed015a5b33e04536917e4fd6e306c"
goto :download_runtime

:download_runtime
set "RUNTIME_DIR=%~dp0.runtime\python-3.14.10-%PYTHON_ARCH%"
if not exist "%RUNTIME_DIR%\python.exe" (
    echo Python was not found. Downloading the portable runtime from python.org...
    powershell -NoProfile -Command "$ErrorActionPreference='Stop'; [Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; $dir=Join-Path (Get-Location) '.runtime\python-3.14.10-%PYTHON_ARCH%'; $archive=Join-Path $dir 'python-embed.zip'; New-Item -ItemType Directory -Force -Path $dir | Out-Null; Invoke-WebRequest -Uri '%PYTHON_URL%' -OutFile $archive; $actual=(Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant(); if ($actual -ne '%PYTHON_SHA256%') { throw 'Downloaded Python checksum did not match.' }; Expand-Archive -LiteralPath $archive -DestinationPath $dir -Force; Remove-Item -LiteralPath $archive -Force"
    if errorlevel 1 (
        echo Python download or verification failed. Check your internet connection and try again.
        pause
        exit /b 1
    )
)
set "PYTHON=%RUNTIME_DIR%\python.exe"

:start_server
start "Runeterra local server" "%PYTHON%" -m http.server 8000 --bind 127.0.0.1
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8000/index.html?v=blacklisted-hover-v9"
exit /b
