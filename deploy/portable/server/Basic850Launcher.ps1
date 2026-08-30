param(
    [string]$PackageRoot = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"
$siteRoot = Join-Path $PackageRoot "www"
$serverScript = Join-Path $PSScriptRoot "Basic850Server.ps1"
$guidePath = Join-Path $PackageRoot "使用说明.txt"

if (-not (Test-Path -LiteralPath (Join-Path $siteRoot "index.html")) -or -not (Test-Path -LiteralPath $serverScript)) {
    Write-Host ""
    Write-Host "启动文件不完整：没有找到 www\index.html 或服务器脚本。" -ForegroundColor Red
    Write-Host "请重新复制整个 理想城Basic850-便携版 文件夹，不要只复制启动文件。"
    [void](Read-Host "按 Enter 键退出")
    exit 1
}

function Show-Menu {
    Write-Host ""
    Write-Host "  Basic 850 英语学习教材 - 一键启动" -ForegroundColor Cyan
    Write-Host "  =================================="
    Write-Host ""
    Write-Host "  [1] 仅本机使用（推荐）"
    Write-Host "  [2] 局域网共享（同一 Wi-Fi 下的手机也能打开）"
    Write-Host "  [3] 打开云服务器上传目录和说明"
    Write-Host "  [4] 退出"
    Write-Host ""
}

while ($true) {
    Show-Menu
    $choice = (Read-Host "请输入 1、2、3 或 4").Trim()

    switch ($choice) {
        "1" {
            & $serverScript -Root $siteRoot -Mode local -Port 4173
            Write-Host ""
            [void](Read-Host "本地服务已经停止。按 Enter 键返回菜单")
        }
        "2" {
            & $serverScript -Root $siteRoot -Mode lan -Port 4173
            Write-Host ""
            [void](Read-Host "本地服务已经停止。按 Enter 键返回菜单")
        }
        "3" {
            Start-Process -FilePath "explorer.exe" -ArgumentList $siteRoot
            if (Test-Path -LiteralPath $guidePath) {
                Start-Process -FilePath "notepad.exe" -ArgumentList $guidePath
            }
        }
        "4" { exit 0 }
        default {
            Write-Host "输入无效，请只输入数字 1、2、3 或 4。" -ForegroundColor Yellow
        }
    }
}
