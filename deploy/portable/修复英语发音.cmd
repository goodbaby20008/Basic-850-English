@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul

if /I "%~1"=="--self-test" (
  powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0server\FixEnglishSpeech.ps1" -SelfTest
  exit /b %errorlevel%
)

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0server\FixEnglishSpeech.ps1"
set "EXITCODE=%errorlevel%"
echo.
if "%EXITCODE%"=="0" (
  echo English speech repair completed. Close and reopen Chrome, then run Sound Check.
) else (
  echo English speech repair did not finish. Read the window message or the guide file.
)
pause
endlocal & exit /b %EXITCODE%
