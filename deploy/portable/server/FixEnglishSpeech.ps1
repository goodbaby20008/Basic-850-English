[CmdletBinding()]
param(
    [switch]$SelfTest
)

$ErrorActionPreference = "Stop"
$packageRoot = Split-Path -Parent $PSScriptRoot
$logPath = Join-Path $packageRoot "英语发音修复日志.txt"

function Write-RepairMessage {
    param(
        [string]$Text,
        [ConsoleColor]$Color = [ConsoleColor]::Gray
    )

    $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Text
    Write-Host $line -ForegroundColor $Color
    Add-Content -LiteralPath $logPath -Value $line -Encoding UTF8
}

function Test-Administrator {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Get-CapabilityState {
    param([string]$Name)
    return (Get-WindowsCapability -Online -Name $Name).State
}

if ($SelfTest) {
    Write-Host "Basic 850 English speech repair script self-test."
    Write-Host ("PowerShell version: " + $PSVersionTable.PSVersion.ToString())
    Write-Host "自助修复脚本编码检查通过。"
    Write-Host "BASIC850_SPEECH_REPAIR_SELFTEST_OK"
    exit 0
}

try {
    if (-not (Test-Path -LiteralPath $env:SystemRoot)) {
        throw "This repair script can only run on Windows."
    }

    if (-not (Get-Command Get-WindowsCapability -ErrorAction SilentlyContinue) -or -not (Get-Command Add-WindowsCapability -ErrorAction SilentlyContinue)) {
        throw "Windows DISM language capability commands are unavailable. Run this file with the built-in Windows PowerShell 5.1 launcher."
    }

    if (-not (Test-Administrator)) {
        Write-Host ""
        Write-Host "需要管理员权限来安装 Windows 英语文本转语音组件。" -ForegroundColor Yellow
        $arguments = '-NoLogo -NoProfile -ExecutionPolicy Bypass -File "' + $PSCommandPath + '"'
        $elevated = Start-Process -FilePath "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe" -ArgumentList $arguments -Verb RunAs -Wait -PassThru
        exit $elevated.ExitCode
    }

    "" | Set-Content -LiteralPath $logPath -Encoding UTF8
    Write-RepairMessage "开始检查英语文本转语音组件。"
    Write-RepairMessage "将安装英语（英国）和英语（美国）的基础组件、文本转语音组件；不会更改 Windows 显示语言。"

    $capabilities = @(
        "Language.Basic~~~en-GB~0.0.1.0",
        "Language.TextToSpeech~~~en-GB~0.0.1.0",
        "Language.Basic~~~en-US~0.0.1.0",
        "Language.TextToSpeech~~~en-US~0.0.1.0"
    )
    $failures = @()

    foreach ($capability in $capabilities) {
        try {
            $state = Get-CapabilityState -Name $capability
            if ($state -eq "Installed") {
                Write-RepairMessage ("已安装：" + $capability) Green
                continue
            }

            Write-RepairMessage ("正在下载并安装：" + $capability) Cyan
            Add-WindowsCapability -Online -Name $capability | Out-Null
            $finalState = Get-CapabilityState -Name $capability
            if ($finalState -ne "Installed") {
                throw ("安装后状态为 " + $finalState)
            }
            Write-RepairMessage ("安装完成：" + $capability) Green
        } catch {
            $message = $capability + " - " + $_.Exception.Message
            $failures += $message
            Write-RepairMessage ("安装失败：" + $message) Red
        }
    }

    if ($failures.Count -gt 0) {
        Write-RepairMessage "未能完成全部组件安装。请确认网络和 Windows Update 可用；若电脑受单位管理，请让管理员允许语言可选功能下载。" Yellow
        Write-RepairMessage "也可在 Windows 设置 → 时间和语言 → 语言和区域中添加英语（英国）或英语（美国），并安装“文本转语音”。" Yellow
        exit 1
    }

    try {
        Add-Type -AssemblyName System.Speech
        $synthesizer = New-Object System.Speech.Synthesis.SpeechSynthesizer
        $voiceCount = @($synthesizer.GetInstalledVoices()).Count
        Write-RepairMessage ("Windows 已报告 " + $voiceCount + " 个可用语音。") Green
        $synthesizer.Speak("Basic 850 sound check.")
        $synthesizer.Dispose()
    } catch {
        Write-RepairMessage "组件已安装，但系统语音测试未完成；请关闭并重新打开 Chrome 后在网站中运行“声音检测”。" Yellow
    }

    Write-RepairMessage "修复完成。请彻底关闭并重新打开 Chrome，然后在教材右上角点“声音检测”。" Green
    exit 0
} catch {
    Write-Host ""
    Write-RepairMessage ("修复无法启动：" + $_.Exception.Message) Red
    Write-RepairMessage "请查看使用说明中的“声音问题”部分。" Yellow
    exit 1
}
