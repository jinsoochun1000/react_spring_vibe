param([switch]$Build)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$envFile = Join-Path $projectRoot '.env.local'
if (Test-Path $envFile) {
    foreach ($line in Get-Content $envFile -Encoding UTF8) {
        if ($line -match '^([A-Z_]+)=(.*)$') { [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process') }
    }
}
if (-not $env:DB_PASSWORD) { throw 'Set DB_PASSWORD or copy .env.example to .env.local and fill in the credentials.' }
Push-Location (Join-Path $projectRoot 'backend')
try {
    if ($Build) { & .\mvnw.cmd -B -ntp package; if ($LASTEXITCODE -ne 0) { throw 'Backend build failed' } }
    & java '-Dfile.encoding=UTF-8' -jar target/crud-tutorial-1.0.0.jar
    if ($LASTEXITCODE -ne 0) { throw 'Backend startup failed' }
} finally { Pop-Location }
