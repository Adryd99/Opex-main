param(
    [string]$Realm = "opex",
    [string]$KeycloakBaseUrl = "http://localhost:8081",
    [string]$AdminRealm = "master",
    [string]$AdminUsername,
    [string]$AdminPassword,
    [string]$SmtpHost,
    [int]$SmtpPort = 587,
    [string]$FromAddress,
    [string]$FromDisplayName = "Opex",
    [ValidateSet("None", "StartTLS", "SSL")]
    [string]$Encryption = "StartTLS",
    [bool]$UseAuthentication = $true,
    [string]$Username,
    [string]$Password
)

$ErrorActionPreference = "Stop"

$libDir = Join-Path (Split-Path -Parent $PSScriptRoot) "lib"
. (Join-Path $libDir "LocalConfig.ps1")
. (Join-Path $libDir "KeycloakAdminApi.ps1")

if ([string]::IsNullOrWhiteSpace($SmtpHost)) {
    throw "SmtpHost is required."
}

if ([string]::IsNullOrWhiteSpace($FromAddress)) {
    throw "FromAddress is required."
}

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

$realmRepresentation.smtpServer = @{
    host = $SmtpHost
    port = $SmtpPort.ToString()
    from = $FromAddress
    fromDisplayName = $FromDisplayName
    auth = $UseAuthentication.ToString().ToLowerInvariant()
    ssl = ($Encryption -eq "SSL").ToString().ToLowerInvariant()
    starttls = ($Encryption -eq "StartTLS").ToString().ToLowerInvariant()
}

if ($UseAuthentication) {
    if ([string]::IsNullOrWhiteSpace($Username) -or [string]::IsNullOrWhiteSpace($Password)) {
        throw "Username and Password are required when UseAuthentication is enabled."
    }

    $realmRepresentation.smtpServer.user = $Username
    $realmRepresentation.smtpServer.password = $Password
}
else {
    $realmRepresentation.smtpServer.PSObject.Properties.Remove("user")
    $realmRepresentation.smtpServer.PSObject.Properties.Remove("password")
}

Invoke-KeycloakAdminApi `
    -Method PUT `
    -BaseUrl $KeycloakBaseUrl `
    -RealmName $Realm `
    -Path "" `
    -Token $token `
    -Body $realmRepresentation | Out-Null

Write-Host "Applied SMTP settings to realm '$Realm'." -ForegroundColor Green
Write-Host "host: $SmtpHost" -ForegroundColor DarkGray
Write-Host "port: $SmtpPort" -ForegroundColor DarkGray
Write-Host "encryption: $Encryption" -ForegroundColor DarkGray
Write-Host "auth: $UseAuthentication" -ForegroundColor DarkGray
