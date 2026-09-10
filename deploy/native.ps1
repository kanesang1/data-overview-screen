param([ValidateSet('start', 'stop', 'reload', 'status')][string]$Action = 'start')
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
try {
    if ($env:OS -ne 'Windows_NT') { throw 'On Linux use sh native.sh.' }
    $root = $PSScriptRoot
    $prefix = $root.Replace('\', '/') + '/'
    $config = Join-Path $root 'deploy/nginx.native.conf'
    $pidFile = Join-Path $root 'logs/native-nginx.pid'
    $archive = Join-Path $root 'native-runtime/nginx-windows.zip'
    foreach ($file in @($config, (Join-Path $root 'index.html'), (Join-Path $root 'config/dashboard-labels.json'))) {
        if (-not (Test-Path -LiteralPath $file -PathType Leaf)) { throw "Missing file: $file. Run from a complete built package." }
    }
    $expected = ((Get-Content -LiteralPath "$archive.sha256" -Raw).Trim() -split '\s+')[0]
    if ($expected -notmatch '^[a-f0-9]{64}$' -or (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash -ne $expected) { throw 'Native runtime checksum mismatch.' }
    $runtime = Join-Path $root ('.native/windows-' + $expected.Substring(0, 12))
    if (-not (Test-Path -LiteralPath "$runtime/ready")) {
        New-Item -ItemType Directory -Force $runtime | Out-Null
        Expand-Archive -LiteralPath $archive -DestinationPath $runtime -Force
        Set-Content -LiteralPath "$runtime/ready" -Value $expected
    }
    $executables = @(Get-ChildItem -LiteralPath $runtime -Filter nginx.exe -Recurse)
    if ($executables.Count -ne 1) { throw 'Invalid Windows runtime: expected one nginx.exe.' }
    $binary = $executables[0].FullName
    New-Item -ItemType Directory -Force (Join-Path $root 'logs') | Out-Null
    $running = $false
    if (Test-Path -LiteralPath $pidFile) {
        $savedPid = (Get-Content -LiteralPath $pidFile -Raw).Trim()
        if ($savedPid -notmatch '^\d+$') { throw 'Invalid native PID file.' }
        $master = Get-CimInstance Win32_Process -Filter "ProcessId = $savedPid"
        if ($master) {
            if ($master.ExecutablePath -ne $binary -or -not $master.CommandLine.Contains($prefix)) { throw 'PID belongs to another process; refusing to signal it.' }
            $running = $true
        }
    }
    if ($Action -eq 'status') {
        if ($running) { Write-Host "Native Nginx running (PID $savedPid)."; exit 0 }
        Write-Host 'Native Nginx stopped.'; exit 1
    }
    function Invoke-Nginx([string[]]$NginxArgs) {
        $ErrorActionPreference = 'Continue'
        & $binary '-p' $prefix '-c' 'deploy/nginx.native.conf' @NginxArgs
        if ($LASTEXITCODE -ne 0) { throw "Nginx failed ($LASTEXITCODE). See logs/native-error.log." }
    }
    if ($Action -eq 'stop') {
        if (-not $running) { Write-Host 'Already stopped.'; exit 0 }
        Invoke-Nginx -NginxArgs @('-s', 'quit')
        for ($i = 0; $i -lt 20; $i++) {
            if (-not (Get-Process -Id $savedPid -ErrorAction SilentlyContinue)) { Write-Host 'Stopped.'; exit 0 }
            Start-Sleep -Milliseconds 250
        }
        throw 'Graceful shutdown is still in progress; check active connections and logs.'
    }
    if ($Action -eq 'reload' -and -not $running) { throw 'Not running. Use -Action start.' }
    Invoke-Nginx -NginxArgs @('-t')
    if ($running) {
        if ($Action -eq 'reload') { Invoke-Nginx -NginxArgs @('-s', 'reload') }
        else { Write-Host 'Already running; use -Action reload after changing configuration.' }
    } else {
        if (Test-Path -LiteralPath $pidFile) { Remove-Item -LiteralPath $pidFile }
        # All values originate from local paths; quote each argument for PowerShell 5.1.
        Start-Process -FilePath $binary -ArgumentList @('-p', ('"' + $prefix + '"'), '-c', 'deploy/nginx.native.conf') -WorkingDirectory $root -WindowStyle Hidden
    }
    $listen = [regex]::Matches((Get-Content -LiteralPath $config -Raw), '(?m)^\s*listen\s+(\d+);')
    if ($listen.Count -ne 1) { throw 'Config must contain one numeric listen port.' }
    $port = $listen[0].Groups[1].Value
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        try {
            foreach ($path in @('/health', '/', '/config/dashboard-labels.json')) {
                $request = [System.Net.HttpWebRequest]::Create("http://127.0.0.1:$port$path")
                $request.Proxy = $null
                $request.Timeout = 1000
                $response = $request.GetResponse()
                try { if ([int]$response.StatusCode -ne 200) { throw 'HTTP check failed' } } finally { $response.Close() }
            }
            if (-not (Test-Path -LiteralPath $pidFile)) { throw 'Nginx did not start (check port conflicts).' }
            Write-Host "Native deployment ready: http://localhost:$port/ (business backend checked separately)."
            exit 0
        } catch { Start-Sleep -Milliseconds 500 }
    }
    throw 'Startup check failed. Check logs/native-error.log and port availability.'
} catch {
    Write-Host "Native deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
