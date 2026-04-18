param(
    [string]$Realm = "opex",
    [string]$KeycloakBaseUrl = "http://localhost:8081",
    [string]$AdminRealm = "master",
    [string]$AdminUsername,
    [string]$AdminPassword,
    [string[]]$SupportedLocales = @("it", "en"),
    [string]$DefaultLocale = "it"
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

$realmRepresentation | Add-Member -NotePropertyName "internationalizationEnabled" -NotePropertyValue $true -Force
$realmRepresentation | Add-Member -NotePropertyName "supportedLocales" -NotePropertyValue @($SupportedLocales) -Force
$realmRepresentation | Add-Member -NotePropertyName "defaultLocale" -NotePropertyValue $DefaultLocale -Force

Invoke-KeycloakAdminApi `
    -Method PUT `
    -BaseUrl $KeycloakBaseUrl `
    -RealmName $Realm `
    -Path "" `
    -Token $token `
    -Body $realmRepresentation | Out-Null

Write-Host "Applied locale settings to realm '$Realm'." -ForegroundColor Green
Write-Host "Supported locales: $($SupportedLocales -join ', ')" -ForegroundColor DarkGray
Write-Host "Default locale: $DefaultLocale" -ForegroundColor DarkGray
