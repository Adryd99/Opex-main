param(
    [string]$Realm = "opex",
    [string]$KeycloakBaseUrl = "http://localhost:8081",
    [string]$AdminRealm = "master",
    [string]$AdminUsername,
    [string]$AdminPassword,
    [string]$ClientId = "opex",
    [string]$ScopeName = "opex-onboarding"
)

$ErrorActionPreference = "Stop"

$libDir = Join-Path (Split-Path -Parent $PSScriptRoot) "lib"
. (Join-Path $libDir "LocalConfig.ps1")
. (Join-Path $libDir "KeycloakAdminApi.ps1")

function Get-SingleClient {
    param(
        [string]$BaseUrl,
        [string]$RealmName,
        [string]$TargetClientId,
        [string]$Token
    )

    $queryClientId = [uri]::EscapeDataString($TargetClientId)
    $clients = @()
    foreach ($client in @(Invoke-KeycloakAdminApi -Method GET -BaseUrl $BaseUrl -RealmName $RealmName -Path "clients?clientId=$queryClientId" -Token $Token)) {
        if ($client.clientId -eq $TargetClientId) {
            $clients += $client
        }
    }

    if ($clients.Count -ne 1) {
        throw "Expected exactly one client with clientId '$TargetClientId' in realm '$RealmName', found $($clients.Count)"
    }

    return $clients[0]
}

function Ensure-ClientScope {
    param(
        [string]$BaseUrl,
        [string]$RealmName,
        [string]$TargetScopeName,
        [string]$Token
    )

    $existingScope = $null
    foreach ($scope in @(Invoke-KeycloakAdminApi -Method GET -BaseUrl $BaseUrl -RealmName $RealmName -Path "client-scopes" -Token $Token)) {
        if ($scope.name -eq $TargetScopeName) {
            $existingScope = $scope
            break
        }
    }

    if ($null -eq $existingScope) {
        $scopePayload = @{
            name = $TargetScopeName
            description = "Expose onboarding claims to Opex tokens"
            protocol = "openid-connect"
            attributes = @{
                "include.in.token.scope" = "false"
                "display.on.consent.screen" = "false"
            }
        }

        Invoke-KeycloakAdminApi -Method POST -BaseUrl $BaseUrl -RealmName $RealmName -Path "client-scopes" -Token $Token -Body $scopePayload -JsonDepth 10 | Out-Null

        foreach ($scope in @(Invoke-KeycloakAdminApi -Method GET -BaseUrl $BaseUrl -RealmName $RealmName -Path "client-scopes" -Token $Token)) {
            if ($scope.name -eq $TargetScopeName) {
                $existingScope = $scope
                break
            }
        }
    }

    if ($null -eq $existingScope) {
        throw "Failed to create or resolve client scope '$TargetScopeName'"
    }

    return $existingScope
}

function Ensure-Mapper {
    param(
        [string]$BaseUrl,
        [string]$RealmName,
        [string]$ScopeId,
        [hashtable]$MapperSpec,
        [string]$Token
    )

    $existingMapper = $null
    foreach ($mapper in @(Invoke-KeycloakAdminApi -Method GET -BaseUrl $BaseUrl -RealmName $RealmName -Path "client-scopes/$ScopeId/protocol-mappers/models" -Token $Token)) {
        if ($mapper.name -eq $MapperSpec.Name) {
            $existingMapper = $mapper
            break
        }
    }

    $mapperPayload = @{
        name = $MapperSpec.Name
        protocol = "openid-connect"
        protocolMapper = "oidc-usermodel-attribute-mapper"
        consentRequired = $false
        config = @{
            "user.attribute" = $MapperSpec.UserAttribute
            "claim.name" = $MapperSpec.ClaimName
            "jsonType.label" = $MapperSpec.JsonType
            "access.token.claim" = "true"
            "id.token.claim" = "true"
            "userinfo.token.claim" = "true"
            "introspection.token.claim" = "true"
            "multivalued" = "false"
        }
    }

    if ($null -eq $existingMapper) {
        Invoke-KeycloakAdminApi `
            -Method POST `
            -BaseUrl $BaseUrl `
            -RealmName $RealmName `
            -Path "client-scopes/$ScopeId/protocol-mappers/models" `
            -Token $Token `
            -Body $mapperPayload `
            -JsonDepth 10 | Out-Null

        return
    }

    $mapperPayload.id = $existingMapper.id

    Invoke-KeycloakAdminApi `
        -Method PUT `
        -BaseUrl $BaseUrl `
        -RealmName $RealmName `
        -Path "client-scopes/$ScopeId/protocol-mappers/models/$($existingMapper.id)" `
        -Token $Token `
        -Body $mapperPayload `
        -JsonDepth 10 | Out-Null
}

function Ensure-DefaultClientScope {
    param(
        [string]$BaseUrl,
        [string]$RealmName,
        [string]$TargetClientUuid,
        [string]$TargetScopeId,
        [string]$Token
    )

    $alreadyAttached = $null
    foreach ($scope in @(Invoke-KeycloakAdminApi -Method GET -BaseUrl $BaseUrl -RealmName $RealmName -Path "clients/$TargetClientUuid/default-client-scopes" -Token $Token)) {
        if ($scope.id -eq $TargetScopeId) {
            $alreadyAttached = $scope
            break
        }
    }

    if ($null -ne $alreadyAttached) {
        return
    }

    try {
        Invoke-KeycloakAdminApi `
            -Method PUT `
            -BaseUrl $BaseUrl `
            -RealmName $RealmName `
            -Path "clients/$TargetClientUuid/default-client-scopes/$TargetScopeId" `
            -Token $Token | Out-Null
        return
    }
    catch {
        Invoke-KeycloakAdminApi `
            -Method POST `
            -BaseUrl $BaseUrl `
            -RealmName $RealmName `
            -Path "clients/$TargetClientUuid/default-client-scopes/$TargetScopeId" `
            -Token $Token | Out-Null
    }
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

$client = Get-SingleClient -BaseUrl $KeycloakBaseUrl -RealmName $Realm -TargetClientId $ClientId -Token $token
$scope = Ensure-ClientScope -BaseUrl $KeycloakBaseUrl -RealmName $Realm -TargetScopeName $ScopeName -Token $token

$mapperSpecs = @(
    @{
        Name = "birthDate"
        UserAttribute = "birthDate"
        ClaimName = "birthDate"
        JsonType = "String"
    },
    @{
        Name = "country"
        UserAttribute = "country"
        ClaimName = "country"
        JsonType = "String"
    },
    @{
        Name = "occupation"
        UserAttribute = "occupation"
        ClaimName = "occupation"
        JsonType = "String"
    },
    @{
        Name = "profilePicture"
        UserAttribute = "profilePicture"
        ClaimName = "profilePicture"
        JsonType = "String"
    },
    @{
        Name = "identityProvider"
        UserAttribute = "identityProvider"
        ClaimName = "identityProvider"
        JsonType = "String"
    },
    @{
        Name = "legalAccepted"
        UserAttribute = "legalAccepted"
        ClaimName = "legalAccepted"
        JsonType = "boolean"
    }
)

foreach ($mapperSpec in $mapperSpecs) {
    Ensure-Mapper -BaseUrl $KeycloakBaseUrl -RealmName $Realm -ScopeId $scope.id -MapperSpec $mapperSpec -Token $token
}

Ensure-DefaultClientScope -BaseUrl $KeycloakBaseUrl -RealmName $Realm -TargetClientUuid $client.id -TargetScopeId $scope.id -Token $token

Write-Host "Applied onboarding token mappers to client '$ClientId' in realm '$Realm'." -ForegroundColor Green
Write-Host "Client scope: $($scope.name)" -ForegroundColor Green
