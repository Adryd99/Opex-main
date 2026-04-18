param(
  [string]$ProjectId,
  [string]$AppDomain,
  [string]$AuthDomain,
  [string]$Network,
  [string]$Subnet,
  [string]$DatabaseHost,
  [string]$ConfigFile = (Join-Path $PSScriptRoot 'env.api'),
  [string]$SecretsFile = (Join-Path $PSScriptRoot 'env.api.secrets'),
  [string]$Region = 'us-central1',
  [string]$Repository = 'opex',
  [string]$ServiceName = 'opex-api',
  [string]$ImageTag = 'latest',
  [int]$DatabasePort = 5432,
  [string]$DatabaseName = 'opexdb',
  [string]$DatabaseUser = 'opex',
  [int]$MaxInstances = 4,
  [string]$AppDatabasePasswordSecret = 'APP_PG_PASSWORD',
  [string]$KeycloakAdminUserSecret = 'KC_ADMIN',
  [string]$KeycloakAdminPasswordSecret = 'KC_ADMIN_PW',
  [string]$SaltEdgeAppIdSecret = 'SALTEDGE_APP_ID',
  [string]$SaltEdgeSecretSecret = 'SALTEDGE_SECRET'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

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

  $value = Resolve-Setting -ParameterName $ParameterName -ConfigKey $ConfigKey -DefaultValue "$DefaultValue"
  return [int]$value
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
$AuthDomain = Resolve-Setting -ParameterName 'AuthDomain' -ConfigKey 'AUTH_DOMAIN' -DefaultValue ''
$Network = Resolve-Setting -ParameterName 'Network' -ConfigKey 'NETWORK' -DefaultValue ''
$Subnet = Resolve-Setting -ParameterName 'Subnet' -ConfigKey 'SUBNET' -DefaultValue ''
$DatabaseHost = Resolve-Setting -ParameterName 'DatabaseHost' -ConfigKey 'APP_PG_HOST' -DefaultValue ''
$Region = Resolve-Setting -ParameterName 'Region' -ConfigKey 'REGION' -DefaultValue $Region
$Repository = Resolve-Setting -ParameterName 'Repository' -ConfigKey 'REPOSITORY' -DefaultValue $Repository
$ServiceName = Resolve-Setting -ParameterName 'ServiceName' -ConfigKey 'SERVICE_NAME' -DefaultValue $ServiceName
$ImageTag = Resolve-Setting -ParameterName 'ImageTag' -ConfigKey 'IMAGE_TAG' -DefaultValue $ImageTag
$DatabasePort = Resolve-IntSetting -ParameterName 'DatabasePort' -ConfigKey 'APP_PG_PORT' -DefaultValue $DatabasePort
$DatabaseName = Resolve-Setting -ParameterName 'DatabaseName' -ConfigKey 'APP_PG_DB' -DefaultValue $DatabaseName
$DatabaseUser = Resolve-Setting -ParameterName 'DatabaseUser' -ConfigKey 'APP_PG_USER' -DefaultValue $DatabaseUser
$MaxInstances = Resolve-IntSetting -ParameterName 'MaxInstances' -ConfigKey 'MAX_INSTANCES' -DefaultValue $MaxInstances

$AppDatabasePasswordSecret = Resolve-SecretSetting -ParameterName 'AppDatabasePasswordSecret' -ConfigKey 'APP_PG_PASSWORD_SECRET' -DefaultValue $AppDatabasePasswordSecret
$KeycloakAdminUserSecret = Resolve-SecretSetting -ParameterName 'KeycloakAdminUserSecret' -ConfigKey 'KC_ADMIN_SECRET' -DefaultValue $KeycloakAdminUserSecret
$KeycloakAdminPasswordSecret = Resolve-SecretSetting -ParameterName 'KeycloakAdminPasswordSecret' -ConfigKey 'KC_ADMIN_PASSWORD_SECRET' -DefaultValue $KeycloakAdminPasswordSecret
$SaltEdgeAppIdSecret = Resolve-SecretSetting -ParameterName 'SaltEdgeAppIdSecret' -ConfigKey 'SALTEDGE_APP_ID_SECRET' -DefaultValue $SaltEdgeAppIdSecret
$SaltEdgeSecretSecret = Resolve-SecretSetting -ParameterName 'SaltEdgeSecretSecret' -ConfigKey 'SALTEDGE_SECRET_SECRET' -DefaultValue $SaltEdgeSecretSecret

Assert-RequiredSetting -Name 'ProjectId' -Value $ProjectId -ConfigKey 'PROJECT_ID' -SourcePath $ConfigFile
Assert-RequiredSetting -Name 'AppDomain' -Value $AppDomain -ConfigKey 'APP_DOMAIN' -SourcePath $ConfigFile
Assert-RequiredSetting -Name 'AuthDomain' -Value $AuthDomain -ConfigKey 'AUTH_DOMAIN' -SourcePath $ConfigFile
Assert-RequiredSetting -Name 'Network' -Value $Network -ConfigKey 'NETWORK' -SourcePath $ConfigFile
Assert-RequiredSetting -Name 'Subnet' -Value $Subnet -ConfigKey 'SUBNET' -SourcePath $ConfigFile
Assert-RequiredSetting -Name 'DatabaseHost' -Value $DatabaseHost -ConfigKey 'APP_PG_HOST' -SourcePath $ConfigFile

$image = "$Region-docker.pkg.dev/$ProjectId/$Repository/${ServiceName}:$ImageTag"

$envVarMap = [ordered]@{
  'APP_PG_HOST' = $DatabaseHost
  'APP_PG_PORT' = "$DatabasePort"
  'APP_PG_DB' = $DatabaseName
  'APP_PG_USER' = $DatabaseUser
  'APP_CORS_ALLOWED_ORIGIN_PATTERNS' = Resolve-Setting -ParameterName 'AppCorsAllowedOriginPatterns' -ConfigKey 'APP_CORS_ALLOWED_ORIGIN_PATTERNS' -DefaultValue "https://$AppDomain,https://$AuthDomain,http://localhost:*,http://127.0.0.1:*"
  'APP_WEB_BASE_URL' = Resolve-Setting -ParameterName 'AppWebBaseUrl' -ConfigKey 'APP_WEB_BASE_URL' -DefaultValue "https://$AppDomain"
  'APP_USER_DEFAULT_VAT_FREQUENCY' = Resolve-Setting -ParameterName 'AppUserDefaultVatFrequency' -ConfigKey 'APP_USER_DEFAULT_VAT_FREQUENCY' -DefaultValue 'Yearly'
  'KEYCLOAK_ISSUER_URI' = Resolve-Setting -ParameterName 'KeycloakIssuerUri' -ConfigKey 'KEYCLOAK_ISSUER_URI' -DefaultValue "https://$AuthDomain/realms/opex"
  'KEYCLOAK_SERVER_URL' = Resolve-Setting -ParameterName 'KeycloakServerUrl' -ConfigKey 'KEYCLOAK_SERVER_URL' -DefaultValue "https://$AuthDomain"
  'KEYCLOAK_ADMIN_REALM' = Resolve-Setting -ParameterName 'KeycloakAdminRealm' -ConfigKey 'KEYCLOAK_ADMIN_REALM' -DefaultValue 'master'
  'KEYCLOAK_ADMIN_CLIENT_ID' = Resolve-Setting -ParameterName 'KeycloakAdminClientId' -ConfigKey 'KEYCLOAK_ADMIN_CLIENT_ID' -DefaultValue 'admin-cli'
  'KEYCLOAK_TARGET_REALM' = Resolve-Setting -ParameterName 'KeycloakTargetRealm' -ConfigKey 'KEYCLOAK_TARGET_REALM' -DefaultValue 'opex'
  'KEYCLOAK_WEB_CLIENT_ID' = Resolve-Setting -ParameterName 'KeycloakWebClientId' -ConfigKey 'KEYCLOAK_WEB_CLIENT_ID' -DefaultValue 'opex'
  'KEYCLOAK_VERIFY_EMAIL_LIFESPAN_SECONDS' = Resolve-Setting -ParameterName 'KeycloakVerifyEmailLifespanSeconds' -ConfigKey 'KEYCLOAK_VERIFY_EMAIL_LIFESPAN_SECONDS' -DefaultValue '43200'
  'SALTEDGE_RETURN_TO_URL' = Resolve-Setting -ParameterName 'SaltEdgeReturnToUrl' -ConfigKey 'SALTEDGE_RETURN_TO_URL' -DefaultValue "https://$AppDomain/success"
}

foreach ($key in $configValues.Keys | Sort-Object) {
  if ($key -like 'LEGAL_*' -and -not [string]::IsNullOrWhiteSpace([string]$configValues[$key])) {
    $envVarMap[$key] = [string]$configValues[$key]
  }
}

$envVars = $envVarMap.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }
$secrets = @(
  "APP_PG_PASSWORD=${AppDatabasePasswordSecret}:latest",
  "KC_ADMIN=${KeycloakAdminUserSecret}:latest",
  "KC_ADMIN_PW=${KeycloakAdminPasswordSecret}:latest",
  "SALTEDGE_APP_ID=${SaltEdgeAppIdSecret}:latest",
  "SALTEDGE_SECRET=${SaltEdgeSecretSecret}:latest"
)

Write-Host "Deploying $ServiceName using config file: $ConfigFile" -ForegroundColor Cyan
if (Test-Path -LiteralPath $SecretsFile) {
  Write-Host "Using secrets file: $SecretsFile" -ForegroundColor DarkGray
}
else {
  Write-Host "Secrets file not found, using parameter/default secret names." -ForegroundColor Yellow
}

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
  '--set-env-vars', ("^@^" + ($envVars -join '@')),
  '--update-secrets', ($secrets -join ',')
)

& gcloud @arguments
if ($LASTEXITCODE -ne 0) {
  throw "Cloud Run deploy failed for $ServiceName"
}
