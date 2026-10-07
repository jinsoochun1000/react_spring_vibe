$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path $PSScriptRoot -Parent
Push-Location (Join-Path $taskRoot 'frontend')
try {
    & npm.cmd ci
    if ($LASTEXITCODE -ne 0) { throw 'npm ci failed' }
    & npm.cmd run build
    if ($LASTEXITCODE -ne 0) { throw 'Frontend build failed' }
    & npm.cmd test
    if ($LASTEXITCODE -ne 0) { throw 'Frontend tests failed' }
} finally { Pop-Location }
Push-Location (Join-Path $taskRoot 'backend')
try {
    & .\mvnw.cmd -B -ntp clean package '-Ddebug=false'
    if ($LASTEXITCODE -ne 0) { throw 'Backend build or tests failed' }
} finally { Pop-Location }
Write-Host 'Build complete: backend/target/crud-tutorial-1.0.0.jar'
