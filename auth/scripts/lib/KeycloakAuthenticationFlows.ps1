function Get-AuthenticationFlowExecutions {
    param(
        [Parameter(Mandatory = $true)]
        [string]$BaseUrl,
        [Parameter(Mandatory = $true)]
        [string]$RealmName,
        [Parameter(Mandatory = $true)]
        [string]$Token,
        [Parameter(Mandatory = $true)]
        [string]$FlowAlias
    )

    $encodedFlowAlias = [uri]::EscapeDataString($FlowAlias)

    return @(Invoke-KeycloakAdminApi `
        -Method GET `
        -BaseUrl $BaseUrl `
        -RealmName $RealmName `
        -Path "authentication/flows/$encodedFlowAlias/executions" `
        -Token $Token)
}

function Get-AuthenticationExecutionByProviderId {
    param(
        [Parameter(Mandatory = $true)]
        [string]$BaseUrl,
        [Parameter(Mandatory = $true)]
        [string]$RealmName,
        [Parameter(Mandatory = $true)]
        [string]$Token,
        [Parameter(Mandatory = $true)]
        [string]$FlowAlias,
        [Parameter(Mandatory = $true)]
        [string]$ProviderId
    )

    return Get-AuthenticationFlowExecutions `
        -BaseUrl $BaseUrl `
        -RealmName $RealmName `
        -Token $Token `
        -FlowAlias $FlowAlias |
        Where-Object { $_.providerId -eq $ProviderId } |
        Select-Object -First 1
}

function Set-AuthenticationExecutionRequirement {
    param(
        [Parameter(Mandatory = $true)]
        [string]$BaseUrl,
        [Parameter(Mandatory = $true)]
        [string]$RealmName,
        [Parameter(Mandatory = $true)]
        [string]$Token,
        [Parameter(Mandatory = $true)]
        [string]$FlowAlias,
        [Parameter(Mandatory = $true)]
        [string]$ProviderId,
        [Parameter(Mandatory = $true)]
        [ValidateSet("REQUIRED", "ALTERNATIVE", "DISABLED", "CONDITIONAL")]
        [string]$Requirement
    )

    $execution = Get-AuthenticationExecutionByProviderId `
        -BaseUrl $BaseUrl `
        -RealmName $RealmName `
        -Token $Token `
        -FlowAlias $FlowAlias `
        -ProviderId $ProviderId

    if ($null -eq $execution) {
        throw "Execution '$ProviderId' was not found in flow '$FlowAlias'."
    }

    if ($execution.requirement -eq $Requirement) {
        return $execution
    }

    $encodedFlowAlias = [uri]::EscapeDataString($FlowAlias)
    $payload = @{
        id = $execution.id
        requirement = $Requirement
        priority = $execution.priority
    }

    Invoke-KeycloakAdminApi `
        -Method PUT `
        -BaseUrl $BaseUrl `
        -RealmName $RealmName `
        -Path "authentication/flows/$encodedFlowAlias/executions" `
        -Token $Token `
        -Body $payload `
        -JsonDepth 20 | Out-Null

    return Get-AuthenticationExecutionByProviderId `
        -BaseUrl $BaseUrl `
        -RealmName $RealmName `
        -Token $Token `
        -FlowAlias $FlowAlias `
        -ProviderId $ProviderId
}
