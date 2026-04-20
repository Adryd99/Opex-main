param(
  [string]$ProjectId,
  [string]$AuthDomain,
  [string]$ConfigFile = '',
  [string]$SecretsFile = '',
  [string]$Realm = 'opex',
  [string]$AdminRealm = 'master',
  [string]$KeycloakAdminUserSecret = 'KC_ADMIN',
  [string]$KeycloakAdminPasswordSecret = 'KC_ADMIN_PW',
  [switch]$ApplySmtp,
  [string]$SmtpHost,
  [int]$SmtpPort = 587,
  [string]$FromAddress,
  [string]$FromDisplayName = 'Opex',
  [ValidateSet('None', 'StartTLS', 'SSL')]
  [string]$Encryption = 'StartTLS',
  [bool]$UseAuthentication = $true,
  [string]$SmtpUsernameSecret = 'OPEX_SMTP_USERNAME',
  [string]$SmtpPasswordSecret = 'OPEX_SMTP_PASSWORD',
  [switch]$ApplyGoogleIdp,
  [string]$GoogleClientIdSecret = 'OPEX_GOOGLE_CLIENT_ID',
  [string]$GoogleClientSecretSecret = 'OPEX_GOOGLE_CLIENT_SECRET',
  [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
. (Join-Path $PSScriptRoot 'lib\EnvFile.ps1')

$ConfigFile = Resolve-DeployPath -ProvidedPath $ConfigFile -DefaultPaths @(
  (Join-Path $PSScriptRoot 'local\env.auth')
)
$SecretsFile = Resolve-DeployPath -ProvidedPath $SecretsFile -DefaultPaths @(
  (Join-Path $PSScriptRoot 'local\env.auth.secrets')
) -Optional

$providedParameters = @{} + $PSBoundParameters
$configValues = Import-EnvFile -Path $ConfigFile -Optional
$secretValues = Import-EnvFile -Path $SecretsFile -Optional

$ProjectId = if ($providedParameters.ContainsKey('ProjectId')) { $ProjectId } elseif ($configValues.ContainsKey('PROJECT_ID')) { [string]$configValues['PROJECT_ID'] } else { '' }
$AuthDomain = if ($providedParameters.ContainsKey('AuthDomain')) { $AuthDomain } elseif ($configValues.ContainsKey('AUTH_DOMAIN')) { [string]$configValues['AUTH_DOMAIN'] } else { '' }
$Realm = if ($providedParameters.ContainsKey('Realm')) { $Realm } elseif ($configValues.ContainsKey('REALM')) { [string]$configValues['REALM'] } else { $Realm }
$AdminRealm = if ($providedParameters.ContainsKey('AdminRealm')) { $AdminRealm } elseif ($configValues.ContainsKey('ADMIN_REALM')) { [string]$configValues['ADMIN_REALM'] } else { $AdminRealm }
$SmtpHost = if ($providedParameters.ContainsKey('SmtpHost')) { $SmtpHost } elseif ($configValues.ContainsKey('OPEX_SMTP_HOST')) { [string]$configValues['OPEX_SMTP_HOST'] } else { $SmtpHost }
$SmtpPort = if ($providedParameters.ContainsKey('SmtpPort')) { $SmtpPort } elseif ($configValues.ContainsKey('OPEX_SMTP_PORT')) { [int][string]$configValues['OPEX_SMTP_PORT'] } else { $SmtpPort }
$FromAddress = if ($providedParameters.ContainsKey('FromAddress')) { $FromAddress } elseif ($configValues.ContainsKey('OPEX_SMTP_FROM')) { [string]$configValues['OPEX_SMTP_FROM'] } else { $FromAddress }
$FromDisplayName = if ($providedParameters.ContainsKey('FromDisplayName')) { $FromDisplayName } elseif ($configValues.ContainsKey('OPEX_SMTP_FROM_DISPLAY_NAME')) { [string]$configValues['OPEX_SMTP_FROM_DISPLAY_NAME'] } else { $FromDisplayName }
$Encryption = if ($providedParameters.ContainsKey('Encryption')) { $Encryption } elseif ($configValues.ContainsKey('OPEX_SMTP_ENCRYPTION')) { [string]$configValues['OPEX_SMTP_ENCRYPTION'] } else { $Encryption }
$UseAuthentication = if ($providedParameters.ContainsKey('UseAuthentication')) { $UseAuthentication } elseif ($configValues.ContainsKey('OPEX_SMTP_USE_AUTHENTICATION')) { [System.Convert]::ToBoolean([string]$configValues['OPEX_SMTP_USE_AUTHENTICATION']) } else { $UseAuthentication }
$KeycloakAdminUserSecret = if ($providedParameters.ContainsKey('KeycloakAdminUserSecret')) { $KeycloakAdminUserSecret } elseif ($secretValues.ContainsKey('KC_ADMIN_SECRET')) { [string]$secretValues['KC_ADMIN_SECRET'] } else { $KeycloakAdminUserSecret }
$KeycloakAdminPasswordSecret = if ($providedParameters.ContainsKey('KeycloakAdminPasswordSecret')) { $KeycloakAdminPasswordSecret } elseif ($secretValues.ContainsKey('KC_ADMIN_PASSWORD_SECRET')) { [string]$secretValues['KC_ADMIN_PASSWORD_SECRET'] } else { $KeycloakAdminPasswordSecret }
$SmtpUsernameSecret = if ($providedParameters.ContainsKey('SmtpUsernameSecret')) { $SmtpUsernameSecret } elseif ($secretValues.ContainsKey('OPEX_SMTP_USERNAME_SECRET')) { [string]$secretValues['OPEX_SMTP_USERNAME_SECRET'] } else { $SmtpUsernameSecret }
$SmtpPasswordSecret = if ($providedParameters.ContainsKey('SmtpPasswordSecret')) { $SmtpPasswordSecret } elseif ($secretValues.ContainsKey('OPEX_SMTP_PASSWORD_SECRET')) { [string]$secretValues['OPEX_SMTP_PASSWORD_SECRET'] } else { $SmtpPasswordSecret }
$GoogleClientIdSecret = if ($providedParameters.ContainsKey('GoogleClientIdSecret')) { $GoogleClientIdSecret } elseif ($secretValues.ContainsKey('OPEX_GOOGLE_CLIENT_ID_SECRET')) { [string]$secretValues['OPEX_GOOGLE_CLIENT_ID_SECRET'] } else { $GoogleClientIdSecret }
$GoogleClientSecretSecret = if ($providedParameters.ContainsKey('GoogleClientSecretSecret')) { $GoogleClientSecretSecret } elseif ($secretValues.ContainsKey('OPEX_GOOGLE_CLIENT_SECRET_SECRET')) { [string]$secretValues['OPEX_GOOGLE_CLIENT_SECRET_SECRET'] } else { $GoogleClientSecretSecret }

$keycloakBaseUrl = "https://$AuthDomain"
$bootstrapScript = Join-Path $root 'auth\scripts\production\bootstrap-auth-production.ps1'

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

Assert-RequiredSetting -Name 'ProjectId' -Value $ProjectId -ConfigKey 'PROJECT_ID' -SourcePath $ConfigFile
Assert-RequiredSetting -Name 'AuthDomain' -Value $AuthDomain -ConfigKey 'AUTH_DOMAIN' -SourcePath $ConfigFile


function Get-SecretValue {
  param(
    [Parameter(Mandatory = $true)][string]$SecretName
  )

  $arguments = @(
    'secrets', 'versions', 'access', 'latest',
    '--project', $ProjectId,
    '--secret', $SecretName
  )

  $value = (& gcloud @arguments)
  if ($LASTEXITCODE -ne 0) {
    throw "Unable to read secret '$SecretName' from project '$ProjectId'."
  }

  return ($value | Out-String).Trim()
}

if ($DryRun) {
  Write-Host "[DryRun] Auth production settings preflight" -ForegroundColor Yellow
  Write-Host "Config file: $ConfigFile" -ForegroundColor DarkGray
  if (Test-Path -LiteralPath $SecretsFile) {
    Write-Host "Secrets file: $SecretsFile" -ForegroundColor DarkGray
  }
  else {
    Write-Host "Secrets file not found, using parameter/default secret names." -ForegroundColor Yellow
  }
  Write-Host "Keycloak base URL: $keycloakBaseUrl" -ForegroundColor DarkGray
  Write-Host "Realm: $Realm" -ForegroundColor DarkGray
  Write-Host "Admin realm: $AdminRealm" -ForegroundColor DarkGray
  Write-Host "Admin username secret: $KeycloakAdminUserSecret" -ForegroundColor DarkGray
  Write-Host "Admin password secret: $KeycloakAdminPasswordSecret" -ForegroundColor DarkGray

  if ($ApplySmtp) {
    Write-Host "SMTP apply requested." -ForegroundColor DarkGray
    Write-Host "SMTP host: $SmtpHost" -ForegroundColor DarkGray
    Write-Host "SMTP from: $FromAddress" -ForegroundColor DarkGray
    if ($UseAuthentication) {
      Write-Host "SMTP username secret: $SmtpUsernameSecret" -ForegroundColor DarkGray
      Write-Host "SMTP password secret: $SmtpPasswordSecret" -ForegroundColor DarkGray
    }
  }

  if ($ApplyGoogleIdp) {
    Write-Host "Google IDP apply requested." -ForegroundColor DarkGray
    Write-Host "Google client id secret: $GoogleClientIdSecret" -ForegroundColor DarkGray
    Write-Host "Google client secret secret: $GoogleClientSecretSecret" -ForegroundColor DarkGray
  }

  Write-Host "[DryRun] Would invoke $bootstrapScript" -ForegroundColor Yellow
  return
}

$adminUsername = Get-SecretValue -SecretName $KeycloakAdminUserSecret
$adminPassword = Get-SecretValue -SecretName $KeycloakAdminPasswordSecret

$bootstrapArguments = @{
  Realm = $Realm
  KeycloakBaseUrl = $keycloakBaseUrl
  AdminRealm = $AdminRealm
  AdminUsername = $adminUsername
  AdminPassword = $adminPassword
}

if ($ApplySmtp) {
  $bootstrapArguments.ApplySmtp = $true
  $bootstrapArguments.SmtpHost = $SmtpHost
  $bootstrapArguments.SmtpPort = $SmtpPort
  $bootstrapArguments.FromAddress = $FromAddress
  $bootstrapArguments.FromDisplayName = $FromDisplayName
  $bootstrapArguments.Encryption = $Encryption
  $bootstrapArguments.UseAuthentication = $UseAuthentication

  if ($UseAuthentication) {
    $bootstrapArguments.Username = Get-SecretValue -SecretName $SmtpUsernameSecret
    $bootstrapArguments.Password = Get-SecretValue -SecretName $SmtpPasswordSecret
  }
}

if ($ApplyGoogleIdp) {
  $bootstrapArguments.ApplyGoogleIdp = $true
  $bootstrapArguments.GoogleClientId = Get-SecretValue -SecretName $GoogleClientIdSecret
  $bootstrapArguments.GoogleClientSecret = Get-SecretValue -SecretName $GoogleClientSecretSecret
}

& $bootstrapScript @bootstrapArguments
if ((Test-Path variable:LASTEXITCODE) -and $LASTEXITCODE -ne 0) {
  throw "Auth production settings apply failed."
}
