param(
    [ValidateSet('auto', 'offline', 'online')][string]$Mode = 'auto',
    [ValidateRange(1, 65535)][int]$Port = 80,
    [ValidatePattern('^[a-zA-Z0-9][a-zA-Z0-9_.-]*$')][string]$Name = 'data-overview-offline'
)
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
function Invoke-DockerUnchecked {
    param([string[]]$DockerArgs)
    # Windows PowerShell 5.1 turns native stderr into ErrorRecords. Inspect of
    # an absent container and a failed pull are expected, not terminating errors.
    $ErrorActionPreference = 'Continue'
    & docker @DockerArgs
    $global:LASTEXITCODE = $LASTEXITCODE
}
function Invoke-Docker {
    param([string[]]$DockerArgs)
    Invoke-DockerUnchecked -DockerArgs $DockerArgs
    if ($LASTEXITCODE -ne 0) { throw "docker $($DockerArgs[0]) failed (exit $LASTEXITCODE)." }
}
function Pull-Image {
    $sources = @('nginx:1.27-alpine', 'public.ecr.aws/docker/library/nginx:1.27-alpine')
    if ($env:OFFLINE_IMAGE_SOURCE) { $sources = @($env:OFFLINE_IMAGE_SOURCE) }
    foreach ($source in $sources) {
        Invoke-DockerUnchecked -DockerArgs @('pull', '--platform', "linux/$arch", $source) | ForEach-Object { Write-Host $_ }
        if ($LASTEXITCODE -eq 0) {
            Invoke-Docker -DockerArgs @('tag', $source, $image) | ForEach-Object { Write-Host $_ }
            return $true
        }
    }
    return $false
}
try {
    if ($env:OS -ne 'Windows_NT') { throw 'On Linux use sh start.sh.' }
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw 'Install Docker Desktop and start its Linux engine first.' }
    $info = (Invoke-Docker -DockerArgs @('info', '--format', '{{json .}}')) | ConvertFrom-Json
    if ($info.OSType -ne 'linux') { throw 'Switch Docker Desktop to Linux containers; Windows containers cannot load these images.' }
    $endpoint = $env:DOCKER_HOST
    if (-not $endpoint) { $endpoint = Invoke-Docker -DockerArgs @('context', 'inspect', '--format', '{{.Endpoints.docker.Host}}') }
    if ($endpoint -notlike 'npipe://*') { throw 'Use the local Docker Desktop context, not a remote Docker server.' }
    switch ($info.Architecture) {
        { $_ -in 'x86_64', 'amd64' } { $arch = 'amd64' }
        { $_ -in 'aarch64', 'arm64' } { $arch = 'arm64' }
        default { throw "Unsupported architecture: $($info.Architecture)" }
    }
    $root = $PSScriptRoot
    $config = Join-Path $root 'deploy/nginx.windows.conf'
    $archive = Join-Path $root "images/nginx-linux-$arch.tar"
    $image = 'nginx:1.27-alpine'
    foreach ($file in @((Join-Path $root 'index.html'), (Join-Path $root 'config/dashboard-labels.json'), $config)) {
        if (-not (Test-Path -LiteralPath $file -PathType Leaf)) { throw "Missing file: $file. Deploy the built dist directory." }
    }
    $listen = [regex]::Matches((Get-Content -LiteralPath $config -Raw), '(?m)^\s*listen\s+(\d+);')
    if ($listen.Count -ne 1) { throw 'Config must have one numeric listen port.' }
    $containerPort = [int]$listen[0].Groups[1].Value
    if ($containerPort -lt 1 -or $containerPort -gt 65535) { throw 'Invalid listen port.' }
    Invoke-DockerUnchecked -DockerArgs @('container', 'inspect', $Name) *> $null
    $existing = $LASTEXITCODE -eq 0
    if ($existing) {
        $labels = (Invoke-Docker -DockerArgs @('inspect', '--format', '{{json .Config.Labels}}', $Name)) | ConvertFrom-Json
        if ($labels.'data-overview.offline' -ne 'true') { throw "Container belongs to another deployment: $Name" }
    }
    Write-Host "[1/4] Image mode: $Mode; platform: linux/$arch"
    $pulled = $false
    if ($Mode -ne 'offline') {
        $pulled = Pull-Image
        if (-not $pulled -and $Mode -eq 'online') { throw 'Online pull failed. Use -Mode offline with a complete package.' }
    }
    if (-not $pulled) {
        if ($Mode -eq 'auto') { Write-Host 'Online sources unavailable; using verified bundled image.' }
        if (-not (Test-Path -LiteralPath $archive) -or -not (Test-Path -LiteralPath "$archive.sha256")) { throw "Missing offline archive/checksum: $archive" }
        $expected = ((Get-Content -LiteralPath "$archive.sha256" -Raw).Trim() -split '\s+')[0]
        if ($expected -notmatch '^[a-fA-F0-9]{64}$') { throw 'Invalid SHA256 file.' }
        if ((Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash -ne $expected) { throw "Offline image checksum mismatch: $archive" }
        Invoke-Docker -DockerArgs @('load', '-i', $archive)
    }
    $platform = Invoke-Docker -DockerArgs @('image', 'inspect', '--format', '{{.Os}}/{{.Architecture}}', $image)
    if ($platform -ne "linux/$arch") { throw "Image platform mismatch: $platform" }
    $imageId = Invoke-Docker -DockerArgs @('image', 'inspect', '--format', '{{.Id}}', $image)
    Write-Host '[2/4] Checking Nginx configuration...'
    Invoke-Docker -DockerArgs @('run', '--pull=never', '--rm', '--entrypoint', 'nginx', '-v', "${config}:/etc/nginx/conf.d/default.conf:ro", $imageId, '-t')
    if ($existing) { Invoke-Docker -DockerArgs @('rm', '-f', $Name) }
    Write-Host '[3/4] Starting dashboard...'
    Invoke-Docker -DockerArgs @('run', '--pull=never', '-d', '--name', $Name, '--label', 'data-overview.offline=true', '--restart', 'unless-stopped', '-p', "${Port}:${containerPort}", '--entrypoint', 'nginx', '-v', "${root}:/usr/share/nginx/html:ro", '-v', "${config}:/etc/nginx/conf.d/default.conf:ro", $imageId, '-g', 'daemon off;')
    Write-Host '[4/4] Checking startup...'
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        $running = Invoke-Docker -DockerArgs @('inspect', '--format', '{{.State.Running}}', $Name)
        if ($running -ne 'true') { break }
        Invoke-DockerUnchecked -DockerArgs @('exec', $Name, 'sh', '-c', 'for path in /health / /config/dashboard-labels.json; do wget -q -O /dev/null "http://127.0.0.1:$1$path" || exit 1; done', 'sh', "$containerPort")
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Deployment ready: http://localhost:$Port/ (backend authentication/data checked separately)."
            exit 0
        }
        Start-Sleep -Seconds 1
    }
    Invoke-DockerUnchecked -DockerArgs @('logs', '--tail', '50', $Name)
    throw 'Startup check failed.'
} catch {
    Write-Host "Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
