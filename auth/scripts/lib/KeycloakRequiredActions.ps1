function Get-RequiredActions {
    param(
        [Parameter(Mandatory = $true)]
        [string]$BaseUrl,
        [Parameter(Mandatory = $true)]
        [string]$RealmName,
        [Parameter(Mandatory = $true)]
        [string]$Token
    )

    return @(Invoke-KeycloakAdminApi -Method GET -BaseUrl $BaseUrl -RealmName $RealmName -Path "authentication/required-actions" -Token $Token)
}

function Get-RequiredActionByAlias {
    param(
        [Parameter(Mandatory = $true)]
        [string]$BaseUrl,
        [Parameter(Mandatory = $true)]
        [string]$RealmName,
        [Parameter(Mandatory = $true)]
        [string]$Token,
        [Parameter(Mandatory = $true)]
        [string]$Alias
    )

    return Get-RequiredActions -BaseUrl $BaseUrl -RealmName $RealmName -Token $Token |
        Where-Object { $_.alias -eq $Alias } |
        Select-Object -First 1
}

function Ensure-RequiredActionRegistered {
    param(
        [Parameter(Mandatory = $true)]
        [string]$BaseUrl,
        [Parameter(Mandatory = $true)]
        [string]$RealmName,
        [Parameter(Mandatory = $true)]
        [string]$Token,
        [Parameter(Mandatory = $true)]
        [string]$ProviderId,
        [Parameter(Mandatory = $true)]
        [string]$Name
    )

    $existingAction = Get-RequiredActionByAlias -BaseUrl $BaseUrl -RealmName $RealmName -Token $Token -Alias $ProviderId
    if ($null -ne $existingAction) {
        return $existingAction
    }

    Invoke-KeycloakAdminApi `
        -Method POST `
        -BaseUrl $BaseUrl `
        -RealmName $RealmName `
        -Path "authentication/register-required-action" `
        -Token $Token `
        -Body @{
            providerId = $ProviderId
            name = $Name
        } | Out-Null

    return Get-RequiredActionByAlias -BaseUrl $BaseUrl -RealmName $RealmName -Token $Token -Alias $ProviderId
}

function Remove-RequiredActionIfPresent {
    param(
        [Parameter(Mandatory = $true)]
        [string]$BaseUrl,
        [Parameter(Mandatory = $true)]
        [string]$RealmName,
        [Parameter(Mandatory = $true)]
        [string]$Token,
        [Parameter(Mandatory = $true)]
        [string]$Alias
    )

    $existingAction = Get-RequiredActionByAlias -BaseUrl $BaseUrl -RealmName $RealmName -Token $Token -Alias $Alias
    if ($null -eq $existingAction) {
        return
    }

    Invoke-KeycloakAdminApi `
        -Method DELETE `
        -BaseUrl $BaseUrl `
        -RealmName $RealmName `
        -Path "authentication/required-actions/$Alias" `
        -Token $Token | Out-Null
}

function Set-RequiredActionConfiguration {
    param(
        [Parameter(Mandatory = $true)]
        [string]$BaseUrl,
        [Parameter(Mandatory = $true)]
        [string]$RealmName,
        [Parameter(Mandatory = $true)]
        [string]$Token,
        [Parameter(Mandatory = $true)]
        [string]$Alias,
        [Parameter(Mandatory = $true)]
        [string]$Name,
        [Parameter(Mandatory = $true)]
        [bool]$Enabled,
        [Parameter(Mandatory = $true)]
        [bool]$DefaultAction,
        [Parameter(Mandatory = $true)]
        [int]$Priority,
        [string]$ProviderId = $Alias,
        [switch]$RegisterIfMissing
    )

    $existingAction = Get-RequiredActionByAlias -BaseUrl $BaseUrl -RealmName $RealmName -Token $Token -Alias $Alias

    if ($null -eq $existingAction) {
        if (-not $RegisterIfMissing) {
            throw "Required action '$Alias' was not found in realm '$RealmName'."
        }

        $existingAction = Ensure-RequiredActionRegistered `
            -BaseUrl $BaseUrl `
            -RealmName $RealmName `
            -Token $Token `
            -ProviderId $ProviderId `
            -Name $Name
    }

    $payload = @{
        alias = $Alias
        name = $Name
        providerId = $ProviderId
        enabled = $Enabled
        defaultAction = $DefaultAction
        priority = $Priority
        config = @{}
    }

    Invoke-KeycloakAdminApi `
        -Method PUT `
        -BaseUrl $BaseUrl `
        -RealmName $RealmName `
        -Path "authentication/required-actions/$Alias" `
        -Token $Token `
        -Body $payload `
        -JsonDepth 10 | Out-Null
}
