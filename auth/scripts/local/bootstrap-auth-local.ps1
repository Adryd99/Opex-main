param(
    [string]$Realm = "opex",
    [string]$KeycloakBaseUrl = "http://localhost:8081",
    [string]$ContainerName = "keycloak",
    [string]$MavenVersion = "3.9.14",
    [int]$KeycloakMajorVersion = 26,
    [switch]$SkipThemeBuild,
    [switch]$SkipProviderBuild,
    [switch]$SkipRealmSetup,
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

$libDir = Join-Path (Split-Path -Parent $PSScriptRoot) "lib"
. (Join-Path $libDir "LocalConfig.ps1")
. (Join-Path $libDir "KeycloakContainer.ps1")

$repoRoot = Get-AuthRepoRoot -ScriptRoot $PSScriptRoot
$localAdminConfig = Get-LocalKeycloakAdminConfig -ScriptRoot $PSScriptRoot
$buildScriptsDir = Join-Path $repoRoot "auth\scripts\build"
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

function Assert-SmtpBootstrapParameters {
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

function Assert-GoogleBootstrapParameters {
    if ([string]::IsNullOrWhiteSpace($GoogleClientId) -or [string]::IsNullOrWhiteSpace($GoogleClientSecret)) {
        throw "GoogleClientId and GoogleClientSecret are required when Google IDP configuration is requested."
    }
}

$runSmtpSetup = Test-SmtpConfigRequested
$runGoogleIdpSetup = Test-GoogleIdpConfigRequested

if ($runSmtpSetup) {
    Assert-SmtpBootstrapParameters
}

if ($runGoogleIdpSetup) {
    Assert-GoogleBootstrapParameters
}

Write-StepHeader -Title "Bootstrap auth locale"
Write-Host "Repo root: $repoRoot" -ForegroundColor DarkGray
Write-Host "Realm: $Realm" -ForegroundColor DarkGray
Write-Host "Keycloak base URL: $KeycloakBaseUrl" -ForegroundColor DarkGray
Write-Host "Keycloak container: $ContainerName" -ForegroundColor DarkGray

if (-not $SkipThemeBuild) {
    Write-StepHeader -Title "Build tema Keycloakify"
    Invoke-AuthScript `
        -ScriptPath (Join-Path $buildScriptsDir "build-local-theme.ps1") `
        -Arguments @{
            MavenVersion = $MavenVersion
            KeycloakMajorVersion = $KeycloakMajorVersion
        }
}
else {
    Write-Host "Skipping theme build." -ForegroundColor Yellow
}

if (-not $SkipProviderBuild) {
    Write-StepHeader -Title "Build provider onboarding"
    Invoke-AuthScript `
        -ScriptPath (Join-Path $buildScriptsDir "build-local-provider.ps1") `
        -Arguments @{
            MavenVersion = $MavenVersion
        }
}
else {
    Write-Host "Skipping provider build." -ForegroundColor Yellow
}

$requiresKeycloakReload = (-not $SkipThemeBuild) -or (-not $SkipProviderBuild)

if ($requiresKeycloakReload) {
    Write-StepHeader -Title "Ricarica Keycloak locale"
    Restart-KeycloakComposeService -ContainerName $ContainerName -ComposeServiceName $ContainerName
    Wait-KeycloakContainerHealthy -ContainerName $ContainerName
}
elseif (-not $SkipRealmSetup) {
    Ensure-KeycloakComposeServiceRunning -ContainerName $ContainerName -ComposeServiceName $ContainerName
    Wait-KeycloakContainerHealthy -ContainerName $ContainerName
}

if (-not $SkipRealmSetup) {
    Write-StepHeader -Title "Applica setting locali del realm"

    $adminApiArgs = @{
        Realm = $Realm
        KeycloakBaseUrl = $KeycloakBaseUrl
        AdminRealm = "master"
        AdminUsername = $localAdminConfig.AdminUser
        AdminPassword = $localAdminConfig.AdminPassword
    }

    Invoke-AuthScript -ScriptPath (Join-Path $localScriptsDir "apply-local-languages.ps1") -Arguments $adminApiArgs
    Invoke-AuthScript -ScriptPath (Join-Path $localScriptsDir "apply-local-login-settings.ps1") -Arguments $adminApiArgs
    Invoke-AuthScript -ScriptPath (Join-Path $localScriptsDir "apply-local-user-profile-settings.ps1") -Arguments @{
        KeycloakBaseUrl = $KeycloakBaseUrl
        AdminRealm = "master"
        AdminUsername = $localAdminConfig.AdminUser
        AdminPassword = $localAdminConfig.AdminPassword
    }
    Invoke-AuthScript -ScriptPath (Join-Path $localScriptsDir "apply-local-security-setup-choice.ps1") -Arguments $adminApiArgs
    Invoke-AuthScript -ScriptPath (Join-Path $localScriptsDir "apply-local-profile-basics.ps1") -Arguments $adminApiArgs
    Invoke-AuthScript -ScriptPath (Join-Path $localScriptsDir "apply-local-country-selection.ps1") -Arguments $adminApiArgs
    Invoke-AuthScript -ScriptPath (Join-Path $localScriptsDir "apply-local-occupation.ps1") -Arguments $adminApiArgs
    Invoke-AuthScript -ScriptPath (Join-Path $localScriptsDir "apply-local-legal-acceptance.ps1") -Arguments $adminApiArgs
    Invoke-AuthScript -ScriptPath (Join-Path $localScriptsDir "apply-local-token-mappers.ps1") -Arguments @{
        Realm = $Realm
        KeycloakBaseUrl = $KeycloakBaseUrl
        AdminRealm = "master"
        AdminUsername = $localAdminConfig.AdminUser
        AdminPassword = $localAdminConfig.AdminPassword
    }

    if ($runSmtpSetup) {
        Write-StepHeader -Title "Applica configurazione SMTP"
        Invoke-AuthScript `
            -ScriptPath (Join-Path $localScriptsDir "apply-local-smtp-settings.ps1") `
            -Arguments @{
                Realm = $Realm
                KeycloakBaseUrl = $KeycloakBaseUrl
                AdminRealm = "master"
                AdminUsername = $localAdminConfig.AdminUser
                AdminPassword = $localAdminConfig.AdminPassword
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
        Write-StepHeader -Title "Applica Google IDP"
        Invoke-AuthScript `
            -ScriptPath (Join-Path $localScriptsDir "apply-local-google-idp.ps1") `
            -Arguments @{
                GoogleClientId = $GoogleClientId
                GoogleClientSecret = $GoogleClientSecret
                Realm = $Realm
                KeycloakBaseUrl = $KeycloakBaseUrl
                AdminRealm = "master"
                AdminUsername = $localAdminConfig.AdminUser
                AdminPassword = $localAdminConfig.AdminPassword
            }
    }
    else {
        Write-Host "Skipping Google IDP setup. Provide Google client credentials to include it." -ForegroundColor Yellow
    }
}
else {
    Write-Host "Skipping realm setup." -ForegroundColor Yellow
}

Write-StepHeader -Title "Bootstrap completato"
Write-Host "Local auth bootstrap completed successfully." -ForegroundColor Green
