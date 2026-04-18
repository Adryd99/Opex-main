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

Ensure-GoogleFirstBrokerLoginFlow `
    -BaseUrl $KeycloakBaseUrl `
    -RealmName $Realm `
    -Token $token `
    -SourceFlowAlias "first broker login" `
    -TargetFlowAlias $googleFirstBrokerFlowAlias

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
Write-Host "Ensured identity provider mappers 'google-first-name' and 'google-last-name' with forced sync to the Keycloak user profile." -ForegroundColor DarkGray
Write-Host "Ensured identity provider mapper 'google-picture' -> user attribute 'profilePicture'." -ForegroundColor DarkGray
Write-Host "Authorized redirect URI for local testing: http://localhost:8081/realms/$Realm/broker/$Alias/endpoint" -ForegroundColor DarkGray
