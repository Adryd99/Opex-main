param(
    [switch]$UseExamplesOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$deployRoot = $PSScriptRoot
$repoRoot = Resolve-Path (Join-Path $deployRoot "..\..")

. (Join-Path $deployRoot "lib\EnvFile.ps1")

function Write-StepHeader {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Title
    )

    Write-Host ""
    Write-Host ("=" * 72) -ForegroundColor DarkGray
    Write-Host $Title -ForegroundColor Cyan
    Write-Host ("=" * 72) -ForegroundColor DarkGray
}

function Resolve-ConfigPath {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$PrimaryPaths,
        [Parameter(Mandatory = $true)]
        [string]$ExamplePath
    )

    if (-not $UseExamplesOnly) {
        foreach ($primaryPath in $PrimaryPaths) {
            if (Test-Path -LiteralPath $primaryPath) {
                return $primaryPath
            }
        }
    }

    return $ExamplePath
}

function Invoke-CheckedScript {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ScriptPath,
        [hashtable]$Arguments = @{}
    )

    & $ScriptPath @Arguments
    if ((Test-Path variable:LASTEXITCODE) -and $LASTEXITCODE -ne 0) {
        throw "Script failed: $ScriptPath"
    }
}

$rootEnvExample = Join-Path $repoRoot ".env.example"
$webLocalEnvExample = Join-Path $repoRoot "opex-web\.env.example"
$authConfig = Resolve-ConfigPath -PrimaryPaths @((Join-Path $deployRoot "local\env.auth")) -ExamplePath (Join-Path $deployRoot "templates\env.auth.example")
$authSecrets = Resolve-ConfigPath -PrimaryPaths @((Join-Path $deployRoot "local\env.auth.secrets")) -ExamplePath (Join-Path $deployRoot "templates\env.auth.secrets.example")
$apiConfig = Resolve-ConfigPath -PrimaryPaths @((Join-Path $deployRoot "local\env.api")) -ExamplePath (Join-Path $deployRoot "templates\env.api.example")
$apiSecrets = Resolve-ConfigPath -PrimaryPaths @((Join-Path $deployRoot "local\env.api.secrets")) -ExamplePath (Join-Path $deployRoot "templates\env.api.secrets.example")
$webConfig = Resolve-ConfigPath -PrimaryPaths @((Join-Path $deployRoot "local\env.web")) -ExamplePath (Join-Path $deployRoot "templates\env.web.example")

$authConfigValues = Import-EnvFile -Path $authConfig
$authSecretValues = Import-EnvFile -Path $authSecrets

$runSmtp = $authConfigValues.ContainsKey("OPEX_SMTP_HOST") -and $authConfigValues.ContainsKey("OPEX_SMTP_FROM")
$runGoogle = $authSecretValues.ContainsKey("OPEX_GOOGLE_CLIENT_ID_SECRET") -and $authSecretValues.ContainsKey("OPEX_GOOGLE_CLIENT_SECRET_SECRET")

Write-StepHeader -Title "Local preflight"
Write-Host "Root env template: $rootEnvExample" -ForegroundColor DarkGray
Write-Host "Web env template: $webLocalEnvExample" -ForegroundColor DarkGray

Push-Location $repoRoot
try {
    & docker compose --env-file $rootEnvExample config | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "docker compose local config validation failed."
    }
}
finally {
    Pop-Location
}

if (-not (Test-Path -LiteralPath $webLocalEnvExample)) {
    throw "Missing frontend local env example: $webLocalEnvExample"
}

Write-Host "Local env templates validated." -ForegroundColor Green

Write-StepHeader -Title "Production preflight"
Write-Host "Auth config: $authConfig" -ForegroundColor DarkGray
Write-Host "Auth secrets: $authSecrets" -ForegroundColor DarkGray
Write-Host "API config: $apiConfig" -ForegroundColor DarkGray
Write-Host "API secrets: $apiSecrets" -ForegroundColor DarkGray
Write-Host "Web config: $webConfig" -ForegroundColor DarkGray

Invoke-CheckedScript -ScriptPath (Join-Path $deployRoot "build-images.ps1") -Arguments @{
    WebConfigFile = $webConfig
    DryRun = $true
}

Invoke-CheckedScript -ScriptPath (Join-Path $deployRoot "deploy-auth.ps1") -Arguments @{
    ConfigFile = $authConfig
    SecretsFile = $authSecrets
    DryRun = $true
}

$applyAuthArgs = @{
    ConfigFile = $authConfig
    SecretsFile = $authSecrets
    DryRun = $true
}

if ($runSmtp) {
    $applyAuthArgs.ApplySmtp = $true
}

if ($runGoogle) {
    $applyAuthArgs.ApplyGoogleIdp = $true
}

Invoke-CheckedScript -ScriptPath (Join-Path $deployRoot "apply-auth-production-settings.ps1") -Arguments $applyAuthArgs

Invoke-CheckedScript -ScriptPath (Join-Path $deployRoot "deploy-api.ps1") -Arguments @{
    ConfigFile = $apiConfig
    SecretsFile = $apiSecrets
    DryRun = $true
}

Invoke-CheckedScript -ScriptPath (Join-Path $deployRoot "deploy-web.ps1") -Arguments @{
    ConfigFile = $webConfig
    DryRun = $true
}

Write-StepHeader -Title "Preflight completed"
Write-Host "Local and production deployment configuration checks completed successfully." -ForegroundColor Green
