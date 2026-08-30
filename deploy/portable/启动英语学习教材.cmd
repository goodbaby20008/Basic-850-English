@echo off
setlocal
chcp 65001 >nul
title Basic 850 英语学习教材

set "SITE_ROOT=%~dp0www"
set "SERVER_SCRIPT=%~dp0server\Basic850Server.ps1"

if not exist "%SITE_ROOT%\index.html" goto missing
if not exist "%SERVER_SCRIPT%" goto missing

:menu
cls
echo.
echo   Basic 850 英语学习教材 - 一键启动
echo   ==================================
echo.
echo   [1] 仅本机使用（推荐）
echo   [2] 局域网共享（同一 Wi-Fi 下的手机也能打开）
echo   [3] 打开云服务器上传目录和说明
echo   [4] 退出
echo.
choice /C 1234 /N /M "请输入 1、2、3 或 4："
if errorlevel 4 exit /b 0
if errorlevel 3 goto cloud
if errorlevel 2 goto lan
goto local

:local
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%SERVER_SCRIPT%" -Root "%SITE_ROOT%" -Mode local -Port 4173
goto stopped

:lan
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%SERVER_SCRIPT%" -Root "%SITE_ROOT%" -Mode lan -Port 4173
goto stopped

:cloud
start "" explorer.exe "%SITE_ROOT%"
start "" notepad.exe "%~dp0使用说明.txt"
goto menu

:missing
echo.
echo 启动文件不完整：没有找到 www\index.html 或服务器脚本。
echo 请重新复制整个“Basic850-便携版”文件夹，不要只复制本启动文件。
pause
exit /b 1

:stopped
echo.
echo 本地服务已经停止。按任意键返回菜单。
pause >nul
goto menu
