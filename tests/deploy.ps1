# Run: powershell -NoProfile -ExecutionPolicy Bypass -File tests/deploy.ps1
$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
$fixture = Join-Path $repo ('artifacts/deploy-tests-' + [guid]::NewGuid().ToString('N') + '/package with spaces')
New-Item -ItemType Directory -Force $fixture, "$fixture/deploy", "$fixture/config", "$fixture/images" | Out-Null
Copy-Item "$repo/deploy/deploy.ps1" "$fixture/deploy.ps1"
Copy-Item "$repo/deploy/nginx.windows.conf" "$fixture/deploy/nginx.windows.conf"
Set-Content "$fixture/index.html" 'test'
Set-Content "$fixture/config/dashboard-labels.json" '{}'
Set-Content "$fixture/images/nginx-linux-amd64.tar" 'test archive'
(Get-FileHash "$fixture/images/nginx-linux-amd64.tar").Hash | Set-Content "$fixture/images/nginx-linux-amd64.tar.sha256"
$mock = @'
param([string]$Case, [string]$Mode)
function global:docker {
    Add-Content -LiteralPath "$PSScriptRoot/docker.log" -Value ($args -join ' ')
    $global:LASTEXITCODE = 0
    switch ($args[0]) {
        info { '{"OSType":"linux","Architecture":"amd64"}' }
        context { 'npipe:////./pipe/dockerDesktopLinuxEngine' }
        container { if ($Case -ne 'foreign') { $global:LASTEXITCODE = 1 } }
        inspect { if (($args -join ' ') -like '*Labels*') { '{}' } else { 'true' } }
        pull {
            if ($Case -in 'fallback', 'online-fail') { $global:LASTEXITCODE = 1 }
            if ($Case -eq 'ecr' -and ($args -join ' ') -notlike '*public.ecr.aws*') { $global:LASTEXITCODE = 1 }
            'mock pull output'
        }
        image { if (($args -join ' ') -like '*Architecture*') { if ($Case -eq 'wrongarch') { 'linux/arm64' } else { 'linux/amd64' } } else { 'sha256:test' } }
    }
}
$env:OFFLINE_IMAGE_SOURCE = ''
$env:DOCKER_HOST = ''
& "$PSScriptRoot/deploy.ps1" -Mode $Mode
exit $LASTEXITCODE
'@
Set-Content "$fixture/mock.ps1" $mock -Encoding UTF8
function Check-Case([string]$Case, [string]$Mode, [bool]$Pass) {
    Set-Content "$fixture/docker.log" ''
    $output = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$fixture/mock.ps1" -Case $Case -Mode $Mode 2>&1
    $code = $LASTEXITCODE
    $script:trace = Get-Content "$fixture/docker.log" -Raw
    if (($code -eq 0) -ne $Pass -or ($Pass -and $trace -notmatch '(?m)^run --pull=never -d')) { throw "$Case failed: $output" }
    if (-not $Pass -and $trace -match '(?m)^run --pull=never -d') { throw "$Case started unexpectedly" }
    Write-Host "PASS Windows $Case ($Mode)"
}
Check-Case offline offline $true
if ($trace -match '(?m)^pull ' -or $trace -notmatch '(?m)^load ') { throw 'Offline used network or skipped load' }
Check-Case fallback auto $true
if ($trace -notmatch '(?m)^load ') { throw 'Auto did not fall back' }
Check-Case ecr auto $true
if ($trace -match '(?m)^load ' -or $trace -notmatch 'pull .*public.ecr.aws') { throw 'ECR fallback failed' }
Check-Case online online $true
if ($trace -match '(?m)^load ') { throw 'Online loaded archive' }
Check-Case online-fail online $false
if ($trace -match '(?m)^load ') { throw 'Strict online fell back' }
Check-Case foreign offline $false
if ($trace -match '(?m)^rm ') { throw 'Removed foreign container' }
Check-Case wrongarch offline $false
Add-Content "$fixture/images/nginx-linux-amd64.tar" 'corrupt'
Check-Case checksum offline $false
if ($trace -match '(?m)^load ') { throw 'Loaded corrupt image' }
Remove-Item -LiteralPath "$fixture/images/nginx-linux-amd64.tar"
Check-Case missing offline $false
Check-Case no-archive-online online $true
Write-Host 'All Windows deployment flow tests passed.'
