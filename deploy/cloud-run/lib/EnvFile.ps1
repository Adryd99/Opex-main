Set-StrictMode -Version Latest

function Import-EnvFile {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,
        [switch]$Optional
    )

    $resolvedPath = Resolve-Path -LiteralPath $Path -ErrorAction SilentlyContinue
    if ($null -eq $resolvedPath) {
        if ($Optional) {
            return @{}
        }

        throw "Missing env file: $Path"
    }

    $values = @{}
    foreach ($rawLine in Get-Content -LiteralPath $resolvedPath -Encoding UTF8) {
        $line = $rawLine.Trim()
        if ([string]::IsNullOrWhiteSpace($line) -or $line.StartsWith('#')) {
            continue
        }

        $separatorIndex = $line.IndexOf('=')
        if ($separatorIndex -lt 1) {
            continue
        }

        $key = $line.Substring(0, $separatorIndex).Trim()
        if ($key.StartsWith('export ')) {
            $key = $key.Substring('export '.Length).Trim()
        }

        $value = $line.Substring($separatorIndex + 1).Trim()
        if ($value.Length -ge 2) {
            $doubleQuoted = $value.StartsWith('"') -and $value.EndsWith('"')
            $singleQuoted = $value.StartsWith("'") -and $value.EndsWith("'")
            if ($doubleQuoted -or $singleQuoted) {
                $value = $value.Substring(1, $value.Length - 2)
            }
        }

        $values[$key] = $value
    }

    return $values
}

function Resolve-DeployPath {
    param(
        [AllowEmptyString()]
        [string]$ProvidedPath,
        [string[]]$DefaultPaths,
        [switch]$Optional
    )

    $candidates = @()

    if (-not [string]::IsNullOrWhiteSpace($ProvidedPath)) {
        $candidates += $ProvidedPath
    }

    if ($DefaultPaths) {
        $candidates += $DefaultPaths
    }

    foreach ($candidate in $candidates) {
        if ([string]::IsNullOrWhiteSpace($candidate)) {
            continue
        }

        $resolved = Resolve-Path -LiteralPath $candidate -ErrorAction SilentlyContinue
        if ($null -ne $resolved) {
            return $resolved.ProviderPath
        }
    }

    if ($Optional) {
        if (-not [string]::IsNullOrWhiteSpace($ProvidedPath)) {
            return $ProvidedPath
        }

        if ($DefaultPaths -and $DefaultPaths.Count -gt 0) {
            return $DefaultPaths[0]
        }

        return ''
    }

    throw "Missing file. Checked: $($candidates -join ', ')"
}

function Export-EnvFile {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,
        [Parameter(Mandatory = $true)]
        [hashtable]$Values,
        [string[]]$HeaderLines = @()
    )

    $directory = Split-Path -Parent $Path
    if (-not [string]::IsNullOrWhiteSpace($directory)) {
        New-Item -ItemType Directory -Path $directory -Force | Out-Null
    }

    $lines = New-Object System.Collections.Generic.List[string]

    foreach ($headerLine in $HeaderLines) {
        $lines.Add($headerLine)
    }

    if ($HeaderLines.Count -gt 0) {
        $lines.Add('')
    }

    foreach ($entry in $Values.GetEnumerator()) {
        $lines.Add("$($entry.Key)=$($entry.Value)")
    }

    [System.IO.File]::WriteAllLines($Path, $lines, [System.Text.Encoding]::UTF8)
}
