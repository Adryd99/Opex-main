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
. (Join-Path $libDir "KeycloakAuthenticationFlows.ps1")
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

Set-RequiredActionConfiguration `
    -BaseUrl $KeycloakBaseUrl `
    -RealmName $Realm `
    -Token $token `
    -Alias "CONFIGURE_RECOVERY_AUTHN_CODES" `
    -Name "Recovery Authentication Codes" `
    -Enabled $true `
    -DefaultAction $false `
    -Priority 130 `
    -Config $recentAuthConfig `
    -RegisterIfMissing

$flowRequirements = @(
    @{
        FlowAlias = "Browser - Conditional 2FA"
        Executions = @(
            @{ ProviderId = "conditional-user-configured"; Requirement = "REQUIRED" },
            @{ ProviderId = "conditional-credential"; Requirement = "REQUIRED" },
            @{ ProviderId = "auth-otp-form"; Requirement = "ALTERNATIVE" },
            @{ ProviderId = "webauthn-authenticator"; Requirement = "ALTERNATIVE" },
            @{ ProviderId = "auth-recovery-authn-code-form"; Requirement = "ALTERNATIVE" }
        )
    },
    @{
        FlowAlias = "First broker login - Conditional 2FA"
        Executions = @(
            @{ ProviderId = "conditional-user-configured"; Requirement = "REQUIRED" },
            @{ ProviderId = "conditional-credential"; Requirement = "REQUIRED" },
            @{ ProviderId = "auth-otp-form"; Requirement = "ALTERNATIVE" },
            @{ ProviderId = "webauthn-authenticator"; Requirement = "ALTERNATIVE" },
            @{ ProviderId = "auth-recovery-authn-code-form"; Requirement = "ALTERNATIVE" }
        )
    }
)

Write-Host "Applied 2FA login flows to realm '$Realm'." -ForegroundColor Green
foreach ($flowRequirement in $flowRequirements) {
    $updatedExecutions = @()
    foreach ($executionRequirement in $flowRequirement.Executions) {
        $updatedExecutions += Set-AuthenticationExecutionRequirement `
            -BaseUrl $KeycloakBaseUrl `
            -RealmName $Realm `
            -Token $token `
            -FlowAlias $flowRequirement.FlowAlias `
            -ProviderId $executionRequirement.ProviderId `
            -Requirement $executionRequirement.Requirement
    }

    Write-Host ("Flow: {0}" -f $flowRequirement.FlowAlias) -ForegroundColor Cyan
    foreach ($execution in $updatedExecutions) {
        Write-Host ("{0}: {1}" -f $execution.providerId, $execution.requirement) -ForegroundColor DarkGray
    }
}
