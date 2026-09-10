param(
    [ValidateSet('auto', 'offline', 'online')][string]$Mode = 'auto',
    [ValidateRange(1, 65535)][int]$Port = 8082,
    [string]$Name = 'data-overview-offline'
)
$ErrorActionPreference = 'Stop'
try {
    & (Join-Path $PSScriptRoot 'deploy.ps1') -Mode $Mode -Port $Port -Name $Name
    exit $LASTEXITCODE
} catch {
    Write-Host "Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
