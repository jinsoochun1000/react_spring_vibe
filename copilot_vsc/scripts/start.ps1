$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path $PSScriptRoot -Parent
if (-not (Test-Path (Join-Path $taskRoot '.env'))) { throw 'Create .env from .env.example and configure DB_PASSWORD first.' }
if (-not (Test-Path (Join-Path $taskRoot 'backend/target/crud-tutorial-1.0.0.jar'))) { throw 'Run scripts/build.ps1 first.' }
Push-Location $taskRoot
try { & java '-Dfile.encoding=UTF-8' -jar backend/target/crud-tutorial-1.0.0.jar '--debug=false' }
finally { Pop-Location }
