param(
    [string]$Realm = "opex",
    [string]$KeycloakBaseUrl = "http://localhost:8081",
    [string]$AdminRealm = "master",
    [string]$AdminUsername,
    [string]$AdminPassword
)

$ErrorActionPreference = "Stop"

$libDir = Join-Path (Split-Path -Parent $PSScriptRoot) "lib"
. (Join-Path $libDir "LocalConfig.ps1")
. (Join-Path $libDir "KeycloakAdminApi.ps1")
. (Join-Path $libDir "KeycloakRequiredActions.ps1")

$adminCredentials = Resolve-KeycloakAdminCredentials `
    -ScriptRoot $PSScriptRoot `
    -AdminUsername $AdminUsername `
    -AdminPassword $AdminPassword

$token = Get-KeycloakAdminToken `
    -BaseUrl $KeycloakBaseUrl `
    -Username $adminCredentials.AdminUser `
    -Password $adminCredentials.AdminPassword `
    -AdminRealm $AdminRealm

Set-RequiredActionConfiguration `
    -BaseUrl $KeycloakBaseUrl `
    -RealmName $Realm `
    -Token $token `
    -Alias "OPEX_UPDATE_PASSWORD" `
    -ProviderId "OPEX_UPDATE_PASSWORD" `
    -Name "Opex update password" `
    -Enabled $true `
    -DefaultAction $false `
    -Priority 255 `
    -RegisterIfMissing

Write-Host "Applied OPEX_UPDATE_PASSWORD required action to realm '$Realm'." -ForegroundColor Green
