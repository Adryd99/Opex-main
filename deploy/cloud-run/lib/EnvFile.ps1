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
