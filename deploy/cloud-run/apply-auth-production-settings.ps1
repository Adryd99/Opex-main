param(
  [Parameter(Mandatory = $true)][string]$ProjectId,
  [Parameter(Mandatory = $true)][string]$AuthDomain,
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
  [string]$GoogleClientSecretSecret = 'OPEX_GOOGLE_CLIENT_SECRET'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$bootstrapScript = Join-Path $root 'auth\scripts\production\bootstrap-auth-production.ps1'
$keycloakBaseUrl = "https://$AuthDomain"

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
