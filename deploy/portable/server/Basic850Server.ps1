param(
    [Parameter(Mandatory = $true)]
    [string]$Root,
    [ValidateSet("local", "lan")]
    [string]$Mode = "local",
    [ValidateRange(1024, 65535)]
    [int]$Port = 4173,
    [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"
$resolvedRoot = [System.IO.Path]::GetFullPath((Resolve-Path -LiteralPath $Root).Path)
$rootPrefix = $resolvedRoot.TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
$bindAddress = if ($Mode -eq "lan") { [System.Net.IPAddress]::Any } else { [System.Net.IPAddress]::Loopback }
$listener = $null
$selectedPort = 0

for ($candidatePort = $Port; $candidatePort -le [Math]::Min(65535, $Port + 30); $candidatePort += 1) {
    try {
        $candidate = [System.Net.Sockets.TcpListener]::new($bindAddress, $candidatePort)
        $candidate.Start()
        $listener = $candidate
        $selectedPort = $candidatePort
        break
    }
    catch [System.Net.Sockets.SocketException] {
        if ($candidate) { $candidate.Stop() }
    }
}

if (-not $listener) {
    Write-Host "无法启动：端口 $Port 到 $([Math]::Min(65535, $Port + 30)) 都被占用。" -ForegroundColor Red
    exit 1
}

function Get-ContentType([string]$Path) {
    switch ([System.IO.Path]::GetExtension($Path).ToLowerInvariant()) {
        ".html" { "text/html; charset=utf-8" }
        ".js" { "text/javascript; charset=utf-8" }
        ".css" { "text/css; charset=utf-8" }
        ".json" { "application/json; charset=utf-8" }
        ".svg" { "image/svg+xml" }
        ".webp" { "image/webp" }
        ".png" { "image/png" }
        ".jpg" { "image/jpeg" }
        ".jpeg" { "image/jpeg" }
        ".ico" { "image/x-icon" }
        ".mp3" { "audio/mpeg" }
        ".wav" { "audio/wav" }
        ".txt" { "text/plain; charset=utf-8" }
        ".xml" { "application/xml; charset=utf-8" }
        ".webmanifest" { "application/manifest+json; charset=utf-8" }
        default { "application/octet-stream" }
    }
}

function Write-Response(
    [System.Net.Sockets.NetworkStream]$Stream,
    [int]$StatusCode,
    [string]$StatusText,
    [byte[]]$Body,
    [string]$ContentType,
    [bool]$HeadOnly,
    [hashtable]$ExtraHeaders = @{}
) {
    $headers = [System.Text.StringBuilder]::new()
    [void]$headers.Append("HTTP/1.1 $StatusCode $StatusText`r`n")
    [void]$headers.Append("Content-Type: $ContentType`r`n")
    [void]$headers.Append("Content-Length: $($Body.Length)`r`n")
    [void]$headers.Append("X-Content-Type-Options: nosniff`r`n")
    [void]$headers.Append("Connection: close`r`n")
    foreach ($name in $ExtraHeaders.Keys) {
        [void]$headers.Append("$name`: $($ExtraHeaders[$name])`r`n")
    }
    [void]$headers.Append("`r`n")
    $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headers.ToString())
    $Stream.Write($headerBytes, 0, $headerBytes.Length)
    if (-not $HeadOnly -and $Body.Length -gt 0) {
        $Stream.Write($Body, 0, $Body.Length)
    }
    $Stream.Flush()
}

function Get-LanAddress {
    try {
        return [System.Net.Dns]::GetHostAddresses([System.Net.Dns]::GetHostName()) |
            Where-Object {
                $_.AddressFamily -eq [System.Net.Sockets.AddressFamily]::InterNetwork -and
                -not [System.Net.IPAddress]::IsLoopback($_) -and
                -not $_.ToString().StartsWith("169.254.")
            } |
            Select-Object -First 1
    }
    catch { return $null }
}

$localUrl = "http://127.0.0.1:$selectedPort/"
Write-Host ""
Write-Host "Basic 850 已启动" -ForegroundColor Green
Write-Host "本机地址：$localUrl"
if ($Mode -eq "lan") {
    $lanAddress = Get-LanAddress
    if ($lanAddress) {
        Write-Host "手机地址：http://$($lanAddress.ToString()):$selectedPort/" -ForegroundColor Cyan
        Write-Host "手机与电脑需要连接同一个局域网；首次访问若被防火墙拦截，请允许专用网络访问。"
    }
    else {
        Write-Host "没有自动找到局域网 IPv4 地址；请在 Windows 网络设置中查看本机 IPv4 地址。" -ForegroundColor Yellow
    }
}
Write-Host "按 Ctrl+C 停止服务。关闭这个窗口也会停止。"
Write-Host ""

if (-not $NoBrowser) {
    Start-Process $localUrl
}

try {
    while ($true) {
        $client = $listener.AcceptTcpClient()
        try {
            $client.ReceiveTimeout = 10000
            $client.SendTimeout = 10000
            $stream = $client.GetStream()
            $buffer = [byte[]]::new(4096)
            $requestBytes = [System.IO.MemoryStream]::new()
            $headerComplete = $false

            while (-not $headerComplete -and $requestBytes.Length -lt 32768) {
                $read = $stream.Read($buffer, 0, $buffer.Length)
                if ($read -le 0) { break }
                $requestBytes.Write($buffer, 0, $read)
                $requestText = [System.Text.Encoding]::ASCII.GetString($requestBytes.ToArray())
                $headerComplete = $requestText.Contains("`r`n`r`n")
            }

            if (-not $headerComplete) {
                $body = [System.Text.Encoding]::UTF8.GetBytes("Bad Request")
                Write-Response $stream 400 "Bad Request" $body "text/plain; charset=utf-8" $false
                continue
            }

            $lines = $requestText -split "`r`n"
            $requestLine = $lines[0] -split " "
            if ($requestLine.Length -lt 2) { throw "Invalid request line" }
            $method = $requestLine[0].ToUpperInvariant()
            $headOnly = $method -eq "HEAD"
            if ($method -ne "GET" -and -not $headOnly) {
                $body = [System.Text.Encoding]::UTF8.GetBytes("Method Not Allowed")
                Write-Response $stream 405 "Method Not Allowed" $body "text/plain; charset=utf-8" $false @{ "Allow" = "GET, HEAD" }
                continue
            }

            $rawPath = ($requestLine[1] -split "\?", 2)[0]
            $decodedPath = [System.Uri]::UnescapeDataString($rawPath).Replace("/", [System.IO.Path]::DirectorySeparatorChar).TrimStart([System.IO.Path]::DirectorySeparatorChar)
            if ([string]::IsNullOrWhiteSpace($decodedPath)) { $decodedPath = "index.html" }
            $candidatePath = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($resolvedRoot, $decodedPath))

            if (-not ($candidatePath.Equals($resolvedRoot, [System.StringComparison]::OrdinalIgnoreCase) -or $candidatePath.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase))) {
                $body = [System.Text.Encoding]::UTF8.GetBytes("Forbidden")
                Write-Response $stream 403 "Forbidden" $body "text/plain; charset=utf-8" $headOnly
                continue
            }
            if ([System.IO.Directory]::Exists($candidatePath)) { $candidatePath = [System.IO.Path]::Combine($candidatePath, "index.html") }
            if (-not [System.IO.File]::Exists($candidatePath)) { $candidatePath = [System.IO.Path]::Combine($resolvedRoot, "index.html") }

            $body = [System.IO.File]::ReadAllBytes($candidatePath)
            $contentType = Get-ContentType $candidatePath
            $cacheControl = if ([System.IO.Path]::GetFileName($candidatePath) -in @("index.html", "sw.js")) { "no-cache" } elseif ($candidatePath.Contains("$([System.IO.Path]::DirectorySeparatorChar)assets$([System.IO.Path]::DirectorySeparatorChar)")) { "public, max-age=31536000, immutable" } else { "public, max-age=3600" }
            $extraHeaders = @{ "Cache-Control" = $cacheControl; "Accept-Ranges" = "bytes" }

            $rangeLine = $lines | Where-Object { $_ -match "^Range:\s*bytes=" } | Select-Object -First 1
            if ($rangeLine -and $rangeLine -match "^Range:\s*bytes=(\d*)-(\d*)") {
                $start = if ($Matches[1]) { [long]$Matches[1] } else { 0 }
                $end = if ($Matches[2]) { [long]$Matches[2] } else { $body.Length - 1 }
                $end = [Math]::Min($end, $body.Length - 1)
                if ($start -le $end -and $start -lt $body.Length) {
                    $length = [int]($end - $start + 1)
                    $partial = [byte[]]::new($length)
                    [System.Array]::Copy($body, $start, $partial, 0, $length)
                    $extraHeaders["Content-Range"] = "bytes $start-$end/$($body.Length)"
                    Write-Response $stream 206 "Partial Content" $partial $contentType $headOnly $extraHeaders
                    continue
                }
            }

            Write-Response $stream 200 "OK" $body $contentType $headOnly $extraHeaders
        }
        catch {
            try {
                if ($stream -and $stream.CanWrite) {
                    $body = [System.Text.Encoding]::UTF8.GetBytes("Internal Server Error")
                    Write-Response $stream 500 "Internal Server Error" $body "text/plain; charset=utf-8" $false
                }
            }
            catch { }
        }
        finally {
            if ($stream) { $stream.Dispose() }
            $client.Dispose()
        }
    }
}
finally {
    $listener.Stop()
}
