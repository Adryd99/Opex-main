function Get-AuthRepoRoot {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ScriptRoot
    )

    return (Resolve-Path (Join-Path $ScriptRoot "..\..\..")).Path
}

function Get-AuthEnvFilePath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ScriptRoot
    )

    $repoRoot = Get-AuthRepoRoot -ScriptRoot $ScriptRoot
    $envFilePath = Join-Path $repoRoot ".env"

    if (-not (Test-Path $envFilePath)) {
        throw "Missing .env file at $envFilePath"
    }

    return $envFilePath
}

function Get-EnvValue {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,
        [Parameter(Mandatory = $true)]
        [string]$Key
    )

    $line = Get-Content $Path | Where-Object { $_ -match "^\s*$([regex]::Escape($Key))=" } | Select-Object -First 1

    if ($null -eq $line) {
        throw "Missing $Key in $Path"
    }

    $value = $line.Substring($line.IndexOf("=") + 1).Trim()

    if ($value.StartsWith('"') -and $value.EndsWith('"')) {
        return $value.Trim('"')
    }

    return $value
}

function Get-OptionalEnvValue {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,
        [Parameter(Mandatory = $true)]
        [string]$Key
    )

    $line = Get-Content $Path | Where-Object { $_ -match "^\s*$([regex]::Escape($Key))=" } | Select-Object -First 1

    if ($null -eq $line) {
        return $null
    }

    $value = $line.Substring($line.IndexOf("=") + 1).Trim()

    if ($value.StartsWith('"') -and $value.EndsWith('"')) {
        return $value.Trim('"')
    }

    return $value
}

function Get-LocalKeycloakAdminConfig {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ScriptRoot
    )

    $repoRoot = Get-AuthRepoRoot -ScriptRoot $ScriptRoot
    $envFilePath = Get-AuthEnvFilePath -ScriptRoot $ScriptRoot

    return [pscustomobject]@{
        RepoRoot = $repoRoot
        EnvFilePath = $envFilePath
        AdminUser = Get-EnvValue -Path $envFilePath -Key "KC_ADMIN"
        AdminPassword = Get-EnvValue -Path $envFilePath -Key "KC_ADMIN_PW"
    }
}

function Resolve-KeycloakAdminCredentials {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ScriptRoot,
        [string]$AdminUsername,
        [string]$AdminPassword
    )

    if (-not [string]::IsNullOrWhiteSpace($AdminUsername) -and -not [string]::IsNullOrWhiteSpace($AdminPassword)) {
        return [pscustomobject]@{
            AdminUser = $AdminUsername
            AdminPassword = $AdminPassword
        }
    }

    $localAdminConfig = Get-LocalKeycloakAdminConfig -ScriptRoot $ScriptRoot

    return [pscustomobject]@{
        AdminUser = $localAdminConfig.AdminUser
        AdminPassword = $localAdminConfig.AdminPassword
    }
}
