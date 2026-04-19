function Invoke-KeycloakContainerCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ContainerName,
        [Parameter(Mandatory = $true)]
        [string]$Command
    )

    docker exec $ContainerName sh -lc $Command
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed inside ${ContainerName}: $Command"
    }
}

function Test-KeycloakContainerRunning {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ContainerName
    )

    try {
        $status = docker inspect -f "{{.State.Running}}" $ContainerName 2>$null
        if ($LASTEXITCODE -ne 0) {
            return $false
        }

        return ($status | Select-Object -First 1).Trim() -eq "true"
    }
    catch {
        return $false
    }
}

function Test-KeycloakContainerHealthy {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ContainerName
    )

    $healthStatus = docker inspect -f "{{.State.Health.Status}}" $ContainerName 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Container $ContainerName is not running"
    }

    if ($healthStatus.Trim() -ne "healthy") {
        throw "Container $ContainerName is not healthy"
    }
}

function Wait-KeycloakContainerHealthy {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ContainerName,
        [int]$TimeoutSeconds = 120,
        [int]$PollIntervalSeconds = 2
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)

    while ((Get-Date) -lt $deadline) {
        try {
            Test-KeycloakContainerHealthy -ContainerName $ContainerName
            return
        }
        catch {
            Start-Sleep -Seconds $PollIntervalSeconds
        }
    }

    throw "Timed out waiting for container '$ContainerName' to become healthy."
}

function Ensure-KeycloakComposeServiceRunning {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ContainerName,
        [string]$ComposeServiceName = "keycloak"
    )

    if (Test-KeycloakContainerRunning -ContainerName $ContainerName) {
        return
    }

    docker compose up -d $ComposeServiceName
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to start compose service '$ComposeServiceName'"
    }
}

function Restart-KeycloakComposeService {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ContainerName,
        [string]$ComposeServiceName = "keycloak"
    )

    if (Test-KeycloakContainerRunning -ContainerName $ContainerName) {
        docker compose stop $ComposeServiceName
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to stop compose service '$ComposeServiceName'"
        }
    }

    docker compose up -d --force-recreate $ComposeServiceName
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to recreate compose service '$ComposeServiceName'"
    }
}

function Test-KeycloakContainerCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ContainerName,
        [Parameter(Mandatory = $true)]
        [string]$Command
    )

    docker exec $ContainerName sh -lc $Command *> $null
    return $LASTEXITCODE -eq 0
}

function Initialize-KeycloakContainerAdminSession {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ContainerName,
        [Parameter(Mandatory = $true)]
        [string]$AdminUser,
        [Parameter(Mandatory = $true)]
        [string]$AdminPassword,
        [string]$Server = "http://localhost:8080",
        [string]$AdminRealm = "master"
    )

    Invoke-KeycloakContainerCommand `
        -ContainerName $ContainerName `
        -Command "/opt/keycloak/bin/kcadm.sh config credentials --server $Server --realm $AdminRealm --user $AdminUser --password $AdminPassword >/dev/null"
}
