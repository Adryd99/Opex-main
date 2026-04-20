param(
    [Parameter(Mandatory = $true)]
    [string]$GoogleClientId,
    [Parameter(Mandatory = $true)]
    [string]$GoogleClientSecret,
    [string]$Realm = "opex",
    [string]$KeycloakBaseUrl = "http://localhost:8081",
    [string]$AdminRealm = "master",
    [string]$AdminUsername,
    [string]$AdminPassword,
    [string]$Alias = "google"
)

$ErrorActionPreference = "Stop"

$libDir = Join-Path (Split-Path -Parent $PSScriptRoot) "lib"
. (Join-Path $libDir "LocalConfig.ps1")
. (Join-Path $libDir "KeycloakAdminApi.ps1")

function Get-AuthenticationFlows {
    param(
        [string]$BaseUrl,
        [string]$RealmName,
        [string]$Token
    )

    return @(Invoke-KeycloakAdminApi -Method GET -BaseUrl $BaseUrl -RealmName $RealmName -Path "authentication/flows" -Token $Token)
}

function Get-AuthenticationFlowByAlias {
    param(
        [string]$BaseUrl,
        [string]$RealmName,
        [string]$Token,
        [string]$Alias
    )

    return Get-AuthenticationFlows -BaseUrl $BaseUrl -RealmName $RealmName -Token $Token |
        Where-Object { $_.alias -eq $Alias } |
        Select-Object -First 1
}

function Copy-AuthenticationFlow {
    param(
        [string]$BaseUrl,
        [string]$RealmName,
        [string]$Token,
        [string]$SourceAlias,
        [string]$NewAlias
    )

    Invoke-KeycloakAdminApi `
        -Method POST `
        -BaseUrl $BaseUrl `
        -RealmName $RealmName `
        -Path "authentication/flows/$([uri]::EscapeDataString($SourceAlias))/copy" `
        -Token $Token `
        -Body @{
            newName = $NewAlias
        } | Out-Null
}

function Create-AuthenticationFlow {
    param(
        [string]$BaseUrl,
        [string]$RealmName,
        [string]$Token,
        [string]$Alias,
        [string]$Description
    )

    Invoke-KeycloakAdminApi `
        -Method POST `
        -BaseUrl $BaseUrl `
        -RealmName $RealmName `
        -Path "authentication/flows" `
        -Token $Token `
        -Body @{
            alias = $Alias
            description = $Description
            providerId = "basic-flow"
            topLevel = $true
            builtIn = $false
        } `
        -JsonDepth 10 | Out-Null
}

function Get-AuthenticationFlowExecutions {
    param(
        [string]$BaseUrl,
        [string]$RealmName,
        [string]$Token,
        [string]$FlowAlias
    )

    return @(Invoke-KeycloakAdminApi `
        -Method GET `
        -BaseUrl $BaseUrl `
        -RealmName $RealmName `
        -Path "authentication/flows/$([uri]::EscapeDataString($FlowAlias))/executions" `
        -Token $Token)
}

function Get-AuthenticationExecutionByProviderId {
    param(
        [string]$BaseUrl,
        [string]$RealmName,
        [string]$Token,
        [string]$FlowAlias,
        [string]$ProviderId
    )

    return Get-AuthenticationFlowExecutions `
        -BaseUrl $BaseUrl `
        -RealmName $RealmName `
        -Token $Token `
        -FlowAlias $FlowAlias |
        Where-Object { $_.PSObject.Properties['providerId'] -and $_.providerId -eq $ProviderId } |
        Select-Object -First 1
}

function Get-AuthenticationExecutionByDisplayName {
    param(
        [string]$BaseUrl,
        [string]$RealmName,
        [string]$Token,
        [string]$FlowAlias,
        [string]$DisplayName
    )

    return Get-AuthenticationFlowExecutions `
        -BaseUrl $BaseUrl `
        -RealmName $RealmName `
        -Token $Token `
        -FlowAlias $FlowAlias |
        Where-Object { $_.displayName -eq $DisplayName } |
        Select-Object -First 1
}

function Ensure-AuthenticationFlow {
    param(
        [string]$BaseUrl,
        [string]$RealmName,
        [string]$Token,
        [string]$Alias,
        [string]$Description
    )

    $existingFlow = Get-AuthenticationFlowByAlias `
        -BaseUrl $BaseUrl `
        -RealmName $RealmName `
        -Token $Token `
        -Alias $Alias

    if ($null -eq $existingFlow) {
        Create-AuthenticationFlow `
            -BaseUrl $BaseUrl `
            -RealmName $RealmName `
            -Token $Token `
            -Alias $Alias `
            -Description $Description
    }
}

function Ensure-AuthenticationSubflow {
    param(
        [string]$BaseUrl,
        [string]$RealmName,
        [string]$Token,
        [string]$ParentFlowAlias,
        [string]$SubflowAlias,
        [string]$Description
    )

    $existingSubflow = Get-AuthenticationExecutionByDisplayName `
        -BaseUrl $BaseUrl `
        -RealmName $RealmName `
        -Token $Token `
        -FlowAlias $ParentFlowAlias `
        -DisplayName $SubflowAlias

    if ($null -ne $existingSubflow) {
        return
    }

    Invoke-KeycloakAdminApi `
        -Method POST `
        -BaseUrl $BaseUrl `
        -RealmName $RealmName `
        -Path "authentication/flows/$([uri]::EscapeDataString($ParentFlowAlias))/executions/flow" `
        -Token $Token `
        -Body @{
            alias = $SubflowAlias
            description = $Description
            provider = "basic-flow"
            type = "basic-flow"
        } `
        -JsonDepth 10 | Out-Null
}

function Ensure-AuthenticationExecution {
    param(
        [string]$BaseUrl,
        [string]$RealmName,
        [string]$Token,
        [string]$FlowAlias,
        [string]$ProviderId
    )

    $existingExecution = Get-AuthenticationExecutionByProviderId `
        -BaseUrl $BaseUrl `
        -RealmName $RealmName `
        -Token $Token `
        -FlowAlias $FlowAlias `
        -ProviderId $ProviderId

    if ($null -ne $existingExecution) {
        return
    }

    Invoke-KeycloakAdminApi `
        -Method POST `
        -BaseUrl $BaseUrl `
        -RealmName $RealmName `
        -Path "authentication/flows/$([uri]::EscapeDataString($FlowAlias))/executions/execution" `
        -Token $Token `
        -Body @{
            provider = $ProviderId
        } `
        -JsonDepth 5 | Out-Null
}

function Remove-AuthenticationExecution {
    param(
        [string]$BaseUrl,
        [string]$RealmName,
        [string]$Token,
        [string]$ExecutionId
    )

    Invoke-KeycloakAdminApi `
        -Method DELETE `
        -BaseUrl $BaseUrl `
        -RealmName $RealmName `
        -Path "authentication/executions/$ExecutionId" `
        -Token $Token | Out-Null
}

function Remove-DuplicateAuthenticationExecutions {
    param(
        [string]$BaseUrl,
        [string]$RealmName,
        [string]$Token,
        [string]$FlowAlias,
        [string]$ProviderId
    )

    $matchingExecutions = @(Get-AuthenticationFlowExecutions `
        -BaseUrl $BaseUrl `
        -RealmName $RealmName `
        -Token $Token `
        -FlowAlias $FlowAlias |
        Where-Object { $_.PSObject.Properties['providerId'] -and $_.providerId -eq $ProviderId })

    if ($matchingExecutions.Count -le 1) {
        return
    }

    $matchingExecutions |
        Sort-Object priority, index |
        Select-Object -Skip 1 |
        ForEach-Object {
            Remove-AuthenticationExecution `
                -BaseUrl $BaseUrl `
                -RealmName $RealmName `
                -Token $Token `
                -ExecutionId $_.id
        }
}

function Set-AuthenticationExecutionRequirement {
    param(
        [string]$BaseUrl,
        [string]$RealmName,
        [string]$Token,
        [string]$FlowAlias,
        [string]$DisplayName,
        [string]$Requirement
    )

    $execution = Get-AuthenticationFlowExecutions `
        -BaseUrl $BaseUrl `
        -RealmName $RealmName `
        -Token $Token `
        -FlowAlias $FlowAlias |
        Where-Object { $_.displayName -eq $DisplayName -or $_.displayName -like "*$DisplayName" } |
        Select-Object -First 1

    if ($null -eq $execution) {
        throw "Execution '$DisplayName' was not found in flow '$FlowAlias'."
    }

    if ($execution.requirement -eq $Requirement) {
        return
    }

    $execution.requirement = $Requirement

    Invoke-KeycloakAdminApi `
        -Method PUT `
        -BaseUrl $BaseUrl `
        -RealmName $RealmName `
        -Path "authentication/flows/$([uri]::EscapeDataString($FlowAlias))/executions" `
        -Token $Token `
        -Body $execution `
        -JsonDepth 10 | Out-Null
}

function Ensure-GoogleFirstBrokerLoginFlow {
    param(
        [string]$BaseUrl,
        [string]$RealmName,
        [string]$Token,
        [string]$SourceFlowAlias,
        [string]$TargetFlowAlias
    )

    $existingFlow = Get-AuthenticationFlowByAlias `
        -BaseUrl $BaseUrl `
        -RealmName $RealmName `
        -Token $Token `
        -Alias $TargetFlowAlias

    if ($null -eq $existingFlow) {
        Copy-AuthenticationFlow `
            -BaseUrl $BaseUrl `
            -RealmName $RealmName `
            -Token $Token `
            -SourceAlias $SourceFlowAlias `
            -NewAlias $TargetFlowAlias
    }

    Set-AuthenticationExecutionRequirement `
        -BaseUrl $BaseUrl `
        -RealmName $RealmName `
        -Token $Token `
        -FlowAlias $TargetFlowAlias `
        -DisplayName "Review Profile" `
        -Requirement "DISABLED"

    Set-AuthenticationExecutionRequirement `
        -BaseUrl $BaseUrl `
        -RealmName $RealmName `
        -Token $Token `
        -FlowAlias $TargetFlowAlias `
        -DisplayName "Confirm link existing account" `
        -Requirement "DISABLED"

    Set-AuthenticationExecutionRequirement `
        -BaseUrl $BaseUrl `
        -RealmName $RealmName `
        -Token $Token `
        -FlowAlias $TargetFlowAlias `
        -DisplayName "Verify existing account by Email" `
        -Requirement "DISABLED"

    Set-AuthenticationExecutionRequirement `
        -BaseUrl $BaseUrl `
        -RealmName $RealmName `
        -Token $Token `
        -FlowAlias $TargetFlowAlias `
        -DisplayName "Verify Existing Account by Re-authentication" `
        -Requirement "REQUIRED"
}

function Ensure-GooglePostLogin2FaFlow {
    param(
        [string]$BaseUrl,
        [string]$RealmName,
        [string]$Token,
        [string]$TargetFlowAlias
    )

    $conditionalSubflowAlias = "$TargetFlowAlias Conditional 2FA"

    Ensure-AuthenticationFlow `
        -BaseUrl $BaseUrl `
        -RealmName $RealmName `
        -Token $Token `
        -Alias $TargetFlowAlias `
        -Description "Google post-login 2FA flow"

    Ensure-AuthenticationSubflow `
        -BaseUrl $BaseUrl `
        -RealmName $RealmName `
        -Token $Token `
        -ParentFlowAlias $TargetFlowAlias `
        -SubflowAlias $conditionalSubflowAlias `
        -Description "Prompt for configured second-factor methods after Google sign-in"

    Ensure-AuthenticationExecution `
        -BaseUrl $BaseUrl `
        -RealmName $RealmName `
        -Token $Token `
        -FlowAlias $TargetFlowAlias `
        -ProviderId "allow-access-authenticator"

    Remove-DuplicateAuthenticationExecutions `
        -BaseUrl $BaseUrl `
        -RealmName $RealmName `
        -Token $Token `
        -FlowAlias $TargetFlowAlias `
        -ProviderId "allow-access-authenticator"

    Set-AuthenticationExecutionRequirement `
        -BaseUrl $BaseUrl `
        -RealmName $RealmName `
        -Token $Token `
        -FlowAlias $TargetFlowAlias `
        -DisplayName $conditionalSubflowAlias `
        -Requirement "CONDITIONAL"

    Set-AuthenticationExecutionRequirement `
        -BaseUrl $BaseUrl `
        -RealmName $RealmName `
        -Token $Token `
        -FlowAlias $TargetFlowAlias `
        -DisplayName "Allow access" `
        -Requirement "REQUIRED"

    foreach ($providerId in @(
        "conditional-user-configured",
        "auth-otp-form",
        "webauthn-authenticator",
        "auth-recovery-authn-code-form"
    )) {
        Ensure-AuthenticationExecution `
            -BaseUrl $BaseUrl `
            -RealmName $RealmName `
            -Token $Token `
            -FlowAlias $conditionalSubflowAlias `
            -ProviderId $providerId

        Remove-DuplicateAuthenticationExecutions `
            -BaseUrl $BaseUrl `
            -RealmName $RealmName `
            -Token $Token `
            -FlowAlias $conditionalSubflowAlias `
            -ProviderId $providerId
    }

    Set-AuthenticationExecutionRequirement `
        -BaseUrl $BaseUrl `
        -RealmName $RealmName `
        -Token $Token `
        -FlowAlias $conditionalSubflowAlias `
        -DisplayName "Condition - user configured" `
        -Requirement "REQUIRED"

    Set-AuthenticationExecutionRequirement `
        -BaseUrl $BaseUrl `
        -RealmName $RealmName `
        -Token $Token `
        -FlowAlias $conditionalSubflowAlias `
        -DisplayName "OTP Form" `
        -Requirement "ALTERNATIVE"

    Set-AuthenticationExecutionRequirement `
        -BaseUrl $BaseUrl `
        -RealmName $RealmName `
        -Token $Token `
        -FlowAlias $conditionalSubflowAlias `
        -DisplayName "WebAuthn Authenticator" `
        -Requirement "ALTERNATIVE"

    Set-AuthenticationExecutionRequirement `
        -BaseUrl $BaseUrl `
        -RealmName $RealmName `
        -Token $Token `
        -FlowAlias $conditionalSubflowAlias `
        -DisplayName "Recovery Authentication Code Form" `
        -Requirement "ALTERNATIVE"
}

function Ensure-IdentityProviderMapper {
    param(
        [string]$BaseUrl,
        [string]$RealmName,
        [string]$Alias,
        [string]$Token,
        [hashtable]$MapperSpec
    )

    $existingMapper = $null

    foreach ($mapper in @(Invoke-KeycloakAdminApi -Method GET -BaseUrl $BaseUrl -RealmName $RealmName -Path "identity-provider/instances/$Alias/mappers" -Token $Token)) {
        if ($mapper.name -eq $MapperSpec.Name) {
            $existingMapper = $mapper
            break
        }
    }

    $payload = @{
        name = $MapperSpec.Name
        identityProviderAlias = $Alias
        identityProviderMapper = $MapperSpec.IdentityProviderMapper
        config = $MapperSpec.Config
    }

    if ($null -eq $existingMapper) {
        Invoke-KeycloakAdminApi `
            -Method POST `
            -BaseUrl $BaseUrl `
            -RealmName $RealmName `
            -Path "identity-provider/instances/$Alias/mappers" `
            -Token $Token `
            -Body $payload `
            -JsonDepth 10 | Out-Null
        return
    }

    $payload.id = $existingMapper.id

    Invoke-KeycloakAdminApi `
        -Method PUT `
        -BaseUrl $BaseUrl `
        -RealmName $RealmName `
        -Path "identity-provider/instances/$Alias/mappers/$($existingMapper.id)" `
        -Token $Token `
        -Body $payload `
        -JsonDepth 10 | Out-Null
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

$googleFirstBrokerFlowAlias = "opex-google-first-broker-login"
$googlePostBrokerFlowAlias = "opex-google-post-login-conditional-2fa"

Ensure-GoogleFirstBrokerLoginFlow `
    -BaseUrl $KeycloakBaseUrl `
    -RealmName $Realm `
    -Token $token `
    -SourceFlowAlias "first broker login" `
    -TargetFlowAlias $googleFirstBrokerFlowAlias

Ensure-GooglePostLogin2FaFlow `
    -BaseUrl $KeycloakBaseUrl `
    -RealmName $Realm `
    -Token $token `
    -TargetFlowAlias $googlePostBrokerFlowAlias

$providerPayload = @{
    alias = $Alias
    displayName = "Google"
    providerId = "google"
    enabled = $true
    trustEmail = $true
    storeToken = $false
    addReadTokenRoleOnCreate = $false
    authenticateByDefault = $false
    linkOnly = $false
    firstBrokerLoginFlowAlias = $googleFirstBrokerFlowAlias
    postBrokerLoginFlowAlias = $googlePostBrokerFlowAlias
    updateProfileFirstLoginMode = "off"
    config = @{
        syncMode = "FORCE"
        useJwksUrl = "true"
        clientId = $GoogleClientId
        clientSecret = $GoogleClientSecret
        defaultScope = "openid profile email"
        guiOrder = "10"
    }
}

$existingProvider = Invoke-KeycloakAdminApi `
    -Method GET `
    -BaseUrl $KeycloakBaseUrl `
    -RealmName $Realm `
    -Path "identity-provider/instances/$Alias" `
    -Token $token `
    -AllowNotFound

if ($null -eq $existingProvider) {
    Invoke-KeycloakAdminApi `
        -Method POST `
        -BaseUrl $KeycloakBaseUrl `
        -RealmName $Realm `
        -Path "identity-provider/instances" `
        -Token $token `
        -Body $providerPayload `
        -JsonDepth 10 | Out-Null
}
else {
    $providerPayload.internalId = $existingProvider.internalId
    $providerPayload.hideOnLogin = $existingProvider.hideOnLogin

    Invoke-KeycloakAdminApi `
        -Method PUT `
        -BaseUrl $KeycloakBaseUrl `
        -RealmName $Realm `
        -Path "identity-provider/instances/$Alias" `
        -Token $token `
        -Body $providerPayload `
        -JsonDepth 10 | Out-Null
}

$pictureMapperSpec = @{
    Name = "google-picture"
    IdentityProviderMapper = "oidc-user-attribute-idp-mapper"
    Config = @{
        syncMode = "FORCE"
        claim = "picture"
        "user.attribute" = "profilePicture"
    }
}

 $firstNameMapperSpec = @{
    Name = "google-first-name"
    IdentityProviderMapper = "oidc-user-attribute-idp-mapper"
    Config = @{
        syncMode = "FORCE"
        claim = "given_name"
        "user.attribute" = "firstName"
    }
}

$lastNameMapperSpec = @{
    Name = "google-last-name"
    IdentityProviderMapper = "oidc-user-attribute-idp-mapper"
    Config = @{
        syncMode = "FORCE"
        claim = "family_name"
        "user.attribute" = "lastName"
    }
}

Ensure-IdentityProviderMapper `
    -BaseUrl $KeycloakBaseUrl `
    -RealmName $Realm `
    -Alias $Alias `
    -Token $token `
    -MapperSpec $firstNameMapperSpec

Ensure-IdentityProviderMapper `
    -BaseUrl $KeycloakBaseUrl `
    -RealmName $Realm `
    -Alias $Alias `
    -Token $token `
    -MapperSpec $lastNameMapperSpec

Ensure-IdentityProviderMapper `
    -BaseUrl $KeycloakBaseUrl `
    -RealmName $Realm `
    -Alias $Alias `
    -Token $token `
    -MapperSpec $pictureMapperSpec

Write-Host "Applied local Google identity provider '$Alias' to realm '$Realm'." -ForegroundColor Green
Write-Host "Ensured first broker login flow '$googleFirstBrokerFlowAlias' with password-based linking only." -ForegroundColor DarkGray
Write-Host "Ensured post login flow '$googlePostBrokerFlowAlias' so brokered Google logins still pass through Opex 2FA when configured." -ForegroundColor DarkGray
Write-Host "Ensured identity provider mappers 'google-first-name' and 'google-last-name' with forced sync to the Keycloak user profile." -ForegroundColor DarkGray
Write-Host "Ensured identity provider mapper 'google-picture' -> user attribute 'profilePicture'." -ForegroundColor DarkGray
Write-Host "Authorized redirect URI for local testing: http://localhost:8081/realms/$Realm/broker/$Alias/endpoint" -ForegroundColor DarkGray
