@echo off
setlocal
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0server\Basic850Launcher.ps1" -PackageRoot "%~dp0."
exit /b %errorlevel%
