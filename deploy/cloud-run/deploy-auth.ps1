param(
  [string]$ProjectId,
  [string]$AppDomain,
  [string]$ApiDomain,
  [string]$AuthDomain,
  [string]$Network,
  [string]$Subnet,
  [string]$DatabaseHost,
  [string]$ConfigFile = (Join-Path $PSScriptRoot 'env.auth'),
  [string]$SecretsFile = (Join-Path $PSScriptRoot 'env.auth.secrets'),
  [string]$Region = 'us-central1',
  [string]$Repository = 'opex',
  [string]$ServiceName = 'opex-auth',
  [string]$ImageTag = 'latest',
  [int]$DatabasePort = 5432,
  [string]$DatabaseName = 'keycloak',
  [string]$DatabaseUser = 'keycloak',
  [int]$MaxInstances = 2,
  [string]$BootstrapAdminUserSecret = 'KC_ADMIN',
  [string]$BootstrapAdminPasswordSecret = 'KC_ADMIN_PW',
  [string]$DatabasePasswordSecret = 'KEYCLOAK_DB_PASSWORD',
  [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
. (Join-Path $PSScriptRoot 'lib\EnvFile.ps1')

$providedParameters = @{} + $PSBoundParameters
$configValues = Import-EnvFile -Path $ConfigFile -Optional
$secretValues = Import-EnvFile -Path $SecretsFile -Optional

function Resolve-Setting {
  param(
    [Parameter(Mandatory = $true)][string]$ParameterName,
    [Parameter(Mandatory = $true)][string]$ConfigKey,
    [AllowEmptyString()]
    [Parameter(Mandatory = $true)][string]$DefaultValue
  )

  if ($providedParameters.ContainsKey($ParameterName)) {
    return [string](Get-Variable -Name $ParameterName -ValueOnly)
  }

  if ($configValues.ContainsKey($ConfigKey) -and -not [string]::IsNullOrWhiteSpace([string]$configValues[$ConfigKey])) {
    return [string]$configValues[$ConfigKey]
  }

  return $DefaultValue
}

function Resolve-IntSetting {
  param(
    [Parameter(Mandatory = $true)][string]$ParameterName,
    [Parameter(Mandatory = $true)][string]$ConfigKey,
    [Parameter(Mandatory = $true)][int]$DefaultValue
  )

  return [int](Resolve-Setting -ParameterName $ParameterName -ConfigKey $ConfigKey -DefaultValue "$DefaultValue")
}

function Resolve-SecretSetting {
  param(
    [Parameter(Mandatory = $true)][string]$ParameterName,
    [Parameter(Mandatory = $true)][string]$ConfigKey,
    [Parameter(Mandatory = $true)][string]$DefaultValue
  )

  if ($providedParameters.ContainsKey($ParameterName)) {
    return [string](Get-Variable -Name $ParameterName -ValueOnly)
  }

  if ($secretValues.ContainsKey($ConfigKey) -and -not [string]::IsNullOrWhiteSpace([string]$secretValues[$ConfigKey])) {
    return [string]$secretValues[$ConfigKey]
  }

  return $DefaultValue
}

function Assert-RequiredSetting {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Value,
    [Parameter(Mandatory = $true)][string]$ConfigKey,
    [Parameter(Mandatory = $true)][string]$SourcePath
  )

  if ([string]::IsNullOrWhiteSpace($Value)) {
    throw "$Name is required. Pass -$Name or set $ConfigKey in $SourcePath."
  }
}

$ProjectId = Resolve-Setting -ParameterName 'ProjectId' -ConfigKey 'PROJECT_ID' -DefaultValue ''
$AppDomain = Resolve-Setting -ParameterName 'AppDomain' -ConfigKey 'APP_DOMAIN' -DefaultValue ''
$ApiDomain = Resolve-Setting -ParameterName 'ApiDomain' -ConfigKey 'API_DOMAIN' -DefaultValue "api.$AppDomain"
$AuthDomain = Resolve-Setting -ParameterName 'AuthDomain' -ConfigKey 'AUTH_DOMAIN' -DefaultValue ''
$Network = Resolve-Setting -ParameterName 'Network' -ConfigKey 'NETWORK' -DefaultValue ''
$Subnet = Resolve-Setting -ParameterName 'Subnet' -ConfigKey 'SUBNET' -DefaultValue ''
$DatabaseHost = Resolve-Setting -ParameterName 'DatabaseHost' -ConfigKey 'KEYCLOAK_DB_HOST' -DefaultValue ''
$Region = Resolve-Setting -ParameterName 'Region' -ConfigKey 'REGION' -DefaultValue $Region
$Repository = Resolve-Setting -ParameterName 'Repository' -ConfigKey 'REPOSITORY' -DefaultValue $Repository
$ServiceName = Resolve-Setting -ParameterName 'ServiceName' -ConfigKey 'SERVICE_NAME' -DefaultValue $ServiceName
$ImageTag = Resolve-Setting -ParameterName 'ImageTag' -ConfigKey 'IMAGE_TAG' -DefaultValue $ImageTag
$DatabasePort = Resolve-IntSetting -ParameterName 'DatabasePort' -ConfigKey 'KEYCLOAK_DB_PORT' -DefaultValue $DatabasePort
$DatabaseName = Resolve-Setting -ParameterName 'DatabaseName' -ConfigKey 'KEYCLOAK_DB_NAME' -DefaultValue $DatabaseName
$DatabaseUser = Resolve-Setting -ParameterName 'DatabaseUser' -ConfigKey 'KEYCLOAK_DB_USER' -DefaultValue $DatabaseUser
$MaxInstances = Resolve-IntSetting -ParameterName 'MaxInstances' -ConfigKey 'MAX_INSTANCES' -DefaultValue $MaxInstances

$BootstrapAdminUserSecret = Resolve-SecretSetting -ParameterName 'BootstrapAdminUserSecret' -ConfigKey 'KC_ADMIN_SECRET' -DefaultValue $BootstrapAdminUserSecret
$BootstrapAdminPasswordSecret = Resolve-SecretSetting -ParameterName 'BootstrapAdminPasswordSecret' -ConfigKey 'KC_ADMIN_PASSWORD_SECRET' -DefaultValue $BootstrapAdminPasswordSecret
$DatabasePasswordSecret = Resolve-SecretSetting -ParameterName 'DatabasePasswordSecret' -ConfigKey 'KEYCLOAK_DB_PASSWORD_SECRET' -DefaultValue $DatabasePasswordSecret

Assert-RequiredSetting -Name 'ProjectId' -Value $ProjectId -ConfigKey 'PROJECT_ID' -SourcePath $ConfigFile
Assert-RequiredSetting -Name 'AppDomain' -Value $AppDomain -ConfigKey 'APP_DOMAIN' -SourcePath $ConfigFile
Assert-RequiredSetting -Name 'AuthDomain' -Value $AuthDomain -ConfigKey 'AUTH_DOMAIN' -SourcePath $ConfigFile
Assert-RequiredSetting -Name 'Network' -Value $Network -ConfigKey 'NETWORK' -SourcePath $ConfigFile
Assert-RequiredSetting -Name 'Subnet' -Value $Subnet -ConfigKey 'SUBNET' -SourcePath $ConfigFile
Assert-RequiredSetting -Name 'DatabaseHost' -Value $DatabaseHost -ConfigKey 'KEYCLOAK_DB_HOST' -SourcePath $ConfigFile

$image = "$Region-docker.pkg.dev/$ProjectId/$Repository/${ServiceName}:$ImageTag"
$legalApiPublicUrl = Resolve-Setting -ParameterName 'LegalApiPublicUrl' -ConfigKey 'OPEX_LEGAL_API_PUBLIC_URL' -DefaultValue "https://$ApiDomain/api/legal/public"
$envVars = @(
  'KC_DB=postgres',
  "KC_DB_URL=jdbc:postgresql://${DatabaseHost}:$DatabasePort/$DatabaseName",
  "KC_DB_USERNAME=$DatabaseUser",
  "KC_HOSTNAME=$(Resolve-Setting -ParameterName 'KeycloakHostname' -ConfigKey 'KC_HOSTNAME' -DefaultValue "https://$AuthDomain")",
  "OPEX_APP_ORIGIN=$(Resolve-Setting -ParameterName 'AppOrigin' -ConfigKey 'OPEX_APP_ORIGIN' -DefaultValue "https://$AppDomain")",
  "OPEX_APP_ORIGIN_WILDCARD=$(Resolve-Setting -ParameterName 'AppOriginWildcard' -ConfigKey 'OPEX_APP_ORIGIN_WILDCARD' -DefaultValue "https://$AppDomain/*")",
  "OPEX_LEGAL_APP_BASE_URL=$(Resolve-Setting -ParameterName 'LegalAppBaseUrl' -ConfigKey 'OPEX_LEGAL_APP_BASE_URL' -DefaultValue "https://$AppDomain")",
  "OPEX_LEGAL_API_PUBLIC_URL=$legalApiPublicUrl",
  "KC_LOG_LEVEL=$(Resolve-Setting -ParameterName 'KeycloakLogLevel' -ConfigKey 'KC_LOG_LEVEL' -DefaultValue 'INFO')",
  "KC_HEALTH_ENABLED=$(Resolve-Setting -ParameterName 'KeycloakHealthEnabled' -ConfigKey 'KC_HEALTH_ENABLED' -DefaultValue 'true')",
  "KC_METRICS_ENABLED=$(Resolve-Setting -ParameterName 'KeycloakMetricsEnabled' -ConfigKey 'KC_METRICS_ENABLED' -DefaultValue 'true')"
)
$secrets = @(
  "KC_BOOTSTRAP_ADMIN_USERNAME=${BootstrapAdminUserSecret}:latest",
  "KC_BOOTSTRAP_ADMIN_PASSWORD=${BootstrapAdminPasswordSecret}:latest",
  "KC_DB_PASSWORD=${DatabasePasswordSecret}:latest"
)

$arguments = @(
  'run', 'deploy', $ServiceName,
  '--project', $ProjectId,
  '--region', $Region,
  '--image', $image,
  '--allow-unauthenticated',
  '--port', '8080',
  '--cpu', '1',
  '--memory', '1Gi',
  '--timeout', '300',
  '--min-instances', '0',
  '--max-instances', "$MaxInstances",
  '--network', $Network,
  '--subnet', $Subnet,
  '--vpc-egress', 'private-ranges-only',
  '--set-env-vars', ($envVars -join ','),
  '--update-secrets', ($secrets -join ',')
)

Write-Host "Deploying $ServiceName using config file: $ConfigFile" -ForegroundColor Cyan
if (Test-Path -LiteralPath $SecretsFile) {
  Write-Host "Using secrets file: $SecretsFile" -ForegroundColor DarkGray
}
else {
  Write-Host "Secrets file not found, using parameter/default secret names." -ForegroundColor Yellow
}

if ($DryRun) {
  Write-Host "[DryRun] gcloud $($arguments -join ' ')" -ForegroundColor Yellow
  return
}

& gcloud @arguments
if ($LASTEXITCODE -ne 0) {
  throw "Cloud Run deploy failed for $ServiceName"
}
