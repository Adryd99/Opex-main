param(
    [string]$KeycloakBaseUrl = "http://localhost:8081",
    [string]$AdminRealm = "master",
    [string]$RealmName = "opex",
    [string]$AdminUsername,
    [string]$AdminPassword
)

$ErrorActionPreference = "Stop"

$libDir = Join-Path (Split-Path -Parent $PSScriptRoot) "lib"
. (Join-Path $libDir "LocalConfig.ps1")
. (Join-Path $libDir "KeycloakAdminApi.ps1")

if ([string]::IsNullOrWhiteSpace($AdminUsername) -or [string]::IsNullOrWhiteSpace($AdminPassword)) {
    $adminCredentials = Resolve-KeycloakAdminCredentials `
        -ScriptRoot $PSScriptRoot `
        -AdminUsername $AdminUsername `
        -AdminPassword $AdminPassword
    $AdminUsername = $adminCredentials.AdminUser
    $AdminPassword = $adminCredentials.AdminPassword
}

$token = Get-KeycloakAdminToken `
    -BaseUrl $KeycloakBaseUrl `
    -Username $AdminUsername `
    -Password $AdminPassword `
    -AdminRealm $AdminRealm

$userProfileConfig = Invoke-KeycloakAdminApi `
    -Method GET `
    -BaseUrl $KeycloakBaseUrl `
    -RealmName $RealmName `
    -Path "users/profile" `
    -Token $token

$attributes = @($userProfileConfig.attributes)

foreach ($attribute in $attributes) {
    if ($null -eq $attribute) {
        continue
    }

    if ($attribute.name -in @("firstName", "lastName")) {
        $requiredProperty = $attribute.PSObject.Properties["required"]
        if ($null -ne $requiredProperty) {
            $attribute.PSObject.Properties.Remove("required")
        }
    }
}

$userProfileConfig | Add-Member `
    -NotePropertyName unmanagedAttributePolicy `
    -NotePropertyValue "ENABLED" `
    -Force

Invoke-KeycloakAdminApi `
    -Method PUT `
    -BaseUrl $KeycloakBaseUrl `
    -RealmName $RealmName `
    -Path "users/profile" `
    -Token $token `
    -Body $userProfileConfig `
    -JsonDepth 20 | Out-Null

Write-Host "Enabled unmanaged user attributes for realm '$RealmName'."
