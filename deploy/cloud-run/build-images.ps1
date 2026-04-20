param(
  [string]$ProjectId,
  [string]$AppDomain,
  [string]$ApiDomain,
  [string]$AuthDomain,
  [string]$Region = 'us-central1',
  [string]$Repository = 'opex',
  [string]$Tag = 'latest',
  [string]$WebConfigFile = '',
  [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
. (Join-Path $PSScriptRoot 'lib\EnvFile.ps1')

$WebConfigFile = Resolve-DeployPath -ProvidedPath $WebConfigFile -DefaultPaths @(
  (Join-Path $PSScriptRoot 'local\env.web')
)

$providedParameters = @{} + $PSBoundParameters
$webConfigValues = Import-EnvFile -Path $WebConfigFile -Optional

function Resolve-Setting {
  param(
    [Parameter(Mandatory = $true)][string]$ParameterName,
    [Parameter(Mandatory = $true)][string]$ConfigKey,
    [AllowEmptyString()]
    [Parameter(Mandatory = $true)][string]$DefaultValue,
    [switch]$AllowEmptyConfigValue
  )

  if ($providedParameters.ContainsKey($ParameterName)) {
    return [string](Get-Variable -Name $ParameterName -ValueOnly)
  }

  if ($webConfigValues.ContainsKey($ConfigKey)) {
    $configValue = [string]$webConfigValues[$ConfigKey]
    if ($AllowEmptyConfigValue -or -not [string]::IsNullOrWhiteSpace($configValue)) {
      return $configValue
    }
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
$ApiDomain = Resolve-Setting -ParameterName 'ApiDomain' -ConfigKey 'API_DOMAIN' -DefaultValue ''
$AuthDomain = Resolve-Setting -ParameterName 'AuthDomain' -ConfigKey 'AUTH_DOMAIN' -DefaultValue ''
$Region = Resolve-Setting -ParameterName 'Region' -ConfigKey 'REGION' -DefaultValue $Region
$Repository = Resolve-Setting -ParameterName 'Repository' -ConfigKey 'REPOSITORY' -DefaultValue $Repository
$Tag = Resolve-Setting -ParameterName 'Tag' -ConfigKey 'IMAGE_TAG' -DefaultValue $Tag

Assert-RequiredSetting -Name 'ProjectId' -Value $ProjectId -ConfigKey 'PROJECT_ID' -SourcePath $WebConfigFile
Assert-RequiredSetting -Name 'AppDomain' -Value $AppDomain -ConfigKey 'APP_DOMAIN' -SourcePath $WebConfigFile
Assert-RequiredSetting -Name 'ApiDomain' -Value $ApiDomain -ConfigKey 'API_DOMAIN' -SourcePath $WebConfigFile
Assert-RequiredSetting -Name 'AuthDomain' -Value $AuthDomain -ConfigKey 'AUTH_DOMAIN' -SourcePath $WebConfigFile

$buildApiBaseUrl = Resolve-Setting -ParameterName '_' -ConfigKey 'VITE_API_BASE_URL' -DefaultValue "https://$ApiDomain" -AllowEmptyConfigValue
$buildApiOrigin = Resolve-Setting -ParameterName '_' -ConfigKey 'VITE_API_ORIGIN' -DefaultValue "https://$ApiDomain"
$buildKeycloakAuthUrl = Resolve-Setting -ParameterName '_' -ConfigKey 'VITE_KEYCLOAK_AUTH_URL' -DefaultValue "https://$AuthDomain/realms/opex/protocol/openid-connect/auth"
$buildKeycloakTokenUrl = Resolve-Setting -ParameterName '_' -ConfigKey 'VITE_KEYCLOAK_TOKEN_URL' -DefaultValue "https://$AuthDomain/realms/opex/protocol/openid-connect/token"
$buildKeycloakLogoutUrl = Resolve-Setting -ParameterName '_' -ConfigKey 'VITE_KEYCLOAK_LOGOUT_URL' -DefaultValue "https://$AuthDomain/realms/opex/protocol/openid-connect/logout"
$buildKeycloakClientId = Resolve-Setting -ParameterName '_' -ConfigKey 'VITE_KEYCLOAK_CLIENT_ID' -DefaultValue 'opex'
$buildKeycloakScope = Resolve-Setting -ParameterName '_' -ConfigKey 'VITE_KEYCLOAK_SCOPE' -DefaultValue 'openid profile email'
$buildKeycloakRedirectUri = Resolve-Setting -ParameterName '_' -ConfigKey 'VITE_KEYCLOAK_REDIRECT_URI' -DefaultValue "https://$AppDomain"

function Invoke-CloudBuild {
  param(
    [Parameter(Mandatory = $true)][string]$Config,
    [string]$ExtraSubstitutions = ''
  )

  $baseSubstitutions = "_REGION=$Region,_REPOSITORY=$Repository,_TAG=$Tag"
  $substitutions = if ($ExtraSubstitutions) {
    "$baseSubstitutions,$ExtraSubstitutions"
  } else {
    $baseSubstitutions
  }

  $arguments = @(
    'builds', 'submit', $root,
    '--project', $ProjectId,
    '--config', $Config,
    '--substitutions', $substitutions
  )

  if ($DryRun) {
    Write-Host "[DryRun] gcloud $($arguments -join ' ')" -ForegroundColor Yellow
    return
  }

  & gcloud @arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Cloud Build failed for $Config"
  }
}

Push-Location $root
try {
  Invoke-CloudBuild -Config 'deploy/cloud-run/build/cloudbuild-auth.yaml'
  Invoke-CloudBuild -Config 'deploy/cloud-run/build/cloudbuild-api.yaml'
  Invoke-CloudBuild -Config 'deploy/cloud-run/build/cloudbuild-web.yaml' -ExtraSubstitutions (
    "_BUILD_API_BASE_URL=$buildApiBaseUrl," +
    "_BUILD_API_ORIGIN=$buildApiOrigin," +
    "_BUILD_IDP_LOGIN_URL=$buildKeycloakAuthUrl," +
    "_BUILD_IDP_EXCHANGE_URL=$buildKeycloakTokenUrl," +
    "_BUILD_KEYCLOAK_LOGOUT_URL=$buildKeycloakLogoutUrl," +
    "_BUILD_KEYCLOAK_CLIENT_ID=$buildKeycloakClientId," +
    "_BUILD_KEYCLOAK_SCOPE=$buildKeycloakScope," +
    "_BUILD_KEYCLOAK_REDIRECT_URI=$buildKeycloakRedirectUri"
  )
}
finally {
  Pop-Location
}
