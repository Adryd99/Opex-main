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

$recentAuthConfig = @{
    max_auth_age = "900"
}

Remove-RequiredActionIfPresent `
    -BaseUrl $KeycloakBaseUrl `
    -RealmName $Realm `
    -Token $token `
    -Alias "VERIFY_EMAIL_CODE"

$actionSpecs = @(
    @{
        Alias = "SECURITY_SETUP_CHOICE"
        Name = "Security setup choice"
        Enabled = $true
        DefaultAction = $true
        Priority = 10
        RegisterIfMissing = $true
    },
    @{
        Alias = "OPTIONAL_CONFIGURE_TOTP"
        Name = "Optional configure OTP"
        Enabled = $true
        DefaultAction = $false
        Priority = 20
        RegisterIfMissing = $true
    },
    @{
        Alias = "OPTIONAL_WEBAUTHN_REGISTER"
        Name = "Optional WebAuthn register"
        Enabled = $true
        DefaultAction = $false
        Priority = 30
        RegisterIfMissing = $true
    },
    @{
        Alias = "CONFIGURE_TOTP"
        Name = "Configure OTP"
        Enabled = $true
        DefaultAction = $false
        Priority = 20
        Config = $recentAuthConfig
    },
    @{
        Alias = "webauthn-register"
        Name = "Webauthn Register"
        Enabled = $true
        DefaultAction = $false
        Priority = 30
        Config = $recentAuthConfig
    },
    @{
        Alias = "VERIFY_EMAIL"
        Name = "Verify Email"
        Enabled = $true
        DefaultAction = $false
        Priority = 100
    },
    @{
        Alias = "CONFIGURE_RECOVERY_AUTHN_CODES"
        Name = "Recovery Authentication Codes"
        Enabled = $true
        DefaultAction = $false
        Priority = 35
        Config = $recentAuthConfig
    }
)

foreach ($actionSpec in $actionSpecs) {
    $registerIfMissing = $actionSpec.ContainsKey("RegisterIfMissing") -and [bool]$actionSpec.RegisterIfMissing
    $config = @{}
    if ($actionSpec.ContainsKey("Config") -and $null -ne $actionSpec.Config) {
        $config = $actionSpec.Config
    }

    Set-RequiredActionConfiguration `
        -BaseUrl $KeycloakBaseUrl `
        -RealmName $Realm `
        -Token $token `
        -Alias $actionSpec.Alias `
        -Name $actionSpec.Name `
        -Enabled $actionSpec.Enabled `
        -DefaultAction $actionSpec.DefaultAction `
        -Priority $actionSpec.Priority `
        -Config $config `
        -RegisterIfMissing:$registerIfMissing
}

Write-Host "Applied SECURITY_SETUP_CHOICE onboarding step to realm '$Realm'." -ForegroundColor Green
