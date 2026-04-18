param(
    [string]$Realm = "opex",
    [string]$KeycloakBaseUrl,
    [string]$AdminRealm = "master",
    [string]$AdminUsername,
    [string]$AdminPassword,
    [switch]$ApplySmtp,
    [string]$SmtpHost,
    [int]$SmtpPort = 587,
    [string]$FromAddress,
    [string]$FromDisplayName = "Opex",
    [ValidateSet("None", "StartTLS", "SSL")]
    [string]$Encryption = "StartTLS",
    [bool]$UseAuthentication = $true,
    [string]$Username,
    [string]$Password,
    [switch]$ApplyGoogleIdp,
    [string]$GoogleClientId,
    [string]$GoogleClientSecret
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

if ([string]::IsNullOrWhiteSpace($KeycloakBaseUrl)) {
    throw "KeycloakBaseUrl is required."
}

if ([string]::IsNullOrWhiteSpace($AdminUsername) -or [string]::IsNullOrWhiteSpace($AdminPassword)) {
    throw "AdminUsername and AdminPassword are required."
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..\..")
$localScriptsDir = Join-Path $repoRoot "auth\scripts\local"

function Write-StepHeader {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Title
    )

    Write-Host ""
    Write-Host ("=" * 72) -ForegroundColor DarkGray
    Write-Host $Title -ForegroundColor Cyan
    Write-Host ("=" * 72) -ForegroundColor DarkGray
}

function Invoke-AuthScript {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ScriptPath,
        [hashtable]$Arguments = @{}
    )

    if (-not (Test-Path $ScriptPath)) {
        throw "Missing script: $ScriptPath"
    }

    & $ScriptPath @Arguments
    if ((Test-Path variable:LASTEXITCODE) -and $LASTEXITCODE -ne 0) {
        throw "Script failed: $ScriptPath"
    }
}

function Test-SmtpConfigRequested {
    return $ApplySmtp -or
        $PSBoundParameters.ContainsKey("SmtpHost") -or
        $PSBoundParameters.ContainsKey("FromAddress") -or
        $PSBoundParameters.ContainsKey("Username") -or
        $PSBoundParameters.ContainsKey("Password")
}

function Test-GoogleIdpConfigRequested {
    return $ApplyGoogleIdp -or
        $PSBoundParameters.ContainsKey("GoogleClientId") -or
        $PSBoundParameters.ContainsKey("GoogleClientSecret")
}

function Assert-SmtpParameters {
    if ([string]::IsNullOrWhiteSpace($SmtpHost)) {
        throw "SmtpHost is required when SMTP configuration is requested."
    }

    if ([string]::IsNullOrWhiteSpace($FromAddress)) {
        throw "FromAddress is required when SMTP configuration is requested."
    }

    if ($UseAuthentication -and ([string]::IsNullOrWhiteSpace($Username) -or [string]::IsNullOrWhiteSpace($Password))) {
        throw "Username and Password are required when SMTP authentication is enabled."
    }
}

function Assert-GoogleParameters {
    if ([string]::IsNullOrWhiteSpace($GoogleClientId) -or [string]::IsNullOrWhiteSpace($GoogleClientSecret)) {
        throw "GoogleClientId and GoogleClientSecret are required when Google IDP configuration is requested."
    }
}

$adminApiArgs = @{
    Realm = $Realm
    KeycloakBaseUrl = $KeycloakBaseUrl
    AdminRealm = $AdminRealm
    AdminUsername = $AdminUsername
    AdminPassword = $AdminPassword
}

$runSmtpSetup = Test-SmtpConfigRequested
$runGoogleIdpSetup = Test-GoogleIdpConfigRequested

if ($runSmtpSetup) {
    Assert-SmtpParameters
}

if ($runGoogleIdpSetup) {
    Assert-GoogleParameters
}

Write-StepHeader -Title "Bootstrap auth produzione"
Write-Host "Realm: $Realm" -ForegroundColor DarkGray
Write-Host "Keycloak base URL: $KeycloakBaseUrl" -ForegroundColor DarkGray

Write-StepHeader -Title "Applica setting realm via Admin API"

Invoke-AuthScript -ScriptPath (Join-Path $localScriptsDir "apply-local-languages.ps1") -Arguments $adminApiArgs
Invoke-AuthScript -ScriptPath (Join-Path $localScriptsDir "apply-local-login-settings.ps1") -Arguments $adminApiArgs
Invoke-AuthScript -ScriptPath (Join-Path $localScriptsDir "apply-local-user-profile-settings.ps1") -Arguments @{
    KeycloakBaseUrl = $KeycloakBaseUrl
    AdminRealm = $AdminRealm
    RealmName = $Realm
    AdminUsername = $AdminUsername
    AdminPassword = $AdminPassword
}
Invoke-AuthScript -ScriptPath (Join-Path $localScriptsDir "apply-local-security-setup-choice.ps1") -Arguments $adminApiArgs
Invoke-AuthScript -ScriptPath (Join-Path $localScriptsDir "apply-local-profile-basics.ps1") -Arguments $adminApiArgs
Invoke-AuthScript -ScriptPath (Join-Path $localScriptsDir "apply-local-country-selection.ps1") -Arguments $adminApiArgs
Invoke-AuthScript -ScriptPath (Join-Path $localScriptsDir "apply-local-occupation.ps1") -Arguments $adminApiArgs
Invoke-AuthScript -ScriptPath (Join-Path $localScriptsDir "apply-local-legal-acceptance.ps1") -Arguments $adminApiArgs
Invoke-AuthScript -ScriptPath (Join-Path $localScriptsDir "apply-local-token-mappers.ps1") -Arguments $adminApiArgs

if ($runSmtpSetup) {
    Write-StepHeader -Title "Applica SMTP produzione"
    Invoke-AuthScript -ScriptPath (Join-Path $localScriptsDir "apply-local-smtp-settings.ps1") -Arguments @{
        Realm = $Realm
        KeycloakBaseUrl = $KeycloakBaseUrl
        AdminRealm = $AdminRealm
        AdminUsername = $AdminUsername
        AdminPassword = $AdminPassword
        SmtpHost = $SmtpHost
        SmtpPort = $SmtpPort
        FromAddress = $FromAddress
        FromDisplayName = $FromDisplayName
        Encryption = $Encryption
        UseAuthentication = $UseAuthentication
        Username = $Username
        Password = $Password
    }
}
else {
    Write-Host "Skipping SMTP setup. Provide SMTP parameters to include it." -ForegroundColor Yellow
}

if ($runGoogleIdpSetup) {
    Write-StepHeader -Title "Applica Google IDP produzione"
    Invoke-AuthScript -ScriptPath (Join-Path $localScriptsDir "apply-local-google-idp.ps1") -Arguments @{
        Realm = $Realm
        KeycloakBaseUrl = $KeycloakBaseUrl
        AdminRealm = $AdminRealm
        AdminUsername = $AdminUsername
        AdminPassword = $AdminPassword
        GoogleClientId = $GoogleClientId
        GoogleClientSecret = $GoogleClientSecret
    }
}
else {
    Write-Host "Skipping Google IDP setup. Provide Google client credentials to include it." -ForegroundColor Yellow
}

Write-StepHeader -Title "Bootstrap produzione completato"
Write-Host "Production auth bootstrap completed successfully." -ForegroundColor Green
