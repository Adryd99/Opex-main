param(
    [string]$Realm = "opex",
    [string]$KeycloakBaseUrl = "http://localhost:8081",
    [string]$AdminRealm = "master",
    [string]$AdminUsername,
    [string]$AdminPassword,
    [bool]$ResetPasswordAllowed = $true,
    [string]$PasswordPolicy = "length(10) and lowerCase(1) and upperCase(1) and digits(1) and specialChars(1) and notUsername(undefined) and passwordHistory(3)"
)

$ErrorActionPreference = "Stop"

$libDir = Join-Path (Split-Path -Parent $PSScriptRoot) "lib"
. (Join-Path $libDir "LocalConfig.ps1")
. (Join-Path $libDir "KeycloakAdminApi.ps1")

$adminCredentials = Resolve-KeycloakAdminCredentials `
    -ScriptRoot $PSScriptRoot `
    -AdminUsername $AdminUsername `
    -AdminPassword $AdminPassword

$token = Get-KeycloakAdminToken `
    -BaseUrl $KeycloakBaseUrl `
    -Username $adminCredentials.AdminUser `
    -Password $adminCredentials.AdminPassword `
    -AdminRealm $AdminRealm

$realmRepresentation = Invoke-KeycloakAdminApi `
    -Method GET `
    -BaseUrl $KeycloakBaseUrl `
    -RealmName $Realm `
    -Path "" `
    -Token $token

$realmRepresentation | Add-Member -NotePropertyName "resetPasswordAllowed" -NotePropertyValue $ResetPasswordAllowed -Force
$realmRepresentation | Add-Member -NotePropertyName "passwordPolicy" -NotePropertyValue $PasswordPolicy -Force

Invoke-KeycloakAdminApi `
    -Method PUT `
    -BaseUrl $KeycloakBaseUrl `
    -RealmName $Realm `
    -Path "" `
    -Token $token `
    -Body $realmRepresentation | Out-Null

Write-Host "Applied login settings to realm '$Realm'." -ForegroundColor Green
Write-Host "resetPasswordAllowed: $ResetPasswordAllowed" -ForegroundColor DarkGray
Write-Host "passwordPolicy: $PasswordPolicy" -ForegroundColor DarkGray
