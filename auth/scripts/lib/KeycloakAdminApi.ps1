function Get-KeycloakAdminToken {
    param(
        [Parameter(Mandatory = $true)]
        [string]$BaseUrl,
        [Parameter(Mandatory = $true)]
        [string]$Username,
        [Parameter(Mandatory = $true)]
        [string]$Password,
        [string]$AdminRealm = "master"
    )

    $tokenUri = "$BaseUrl/realms/$AdminRealm/protocol/openid-connect/token"
    $body = "grant_type=password&client_id=admin-cli&username=$([uri]::EscapeDataString($Username))&password=$([uri]::EscapeDataString($Password))"

    $response = Invoke-RestMethod `
        -Method Post `
        -Uri $tokenUri `
        -ContentType "application/x-www-form-urlencoded" `
        -Body $body

    if ([string]::IsNullOrWhiteSpace($response.access_token)) {
        throw "Failed to obtain Keycloak admin token"
    }

    return $response.access_token
}

function Invoke-KeycloakAdminApi {
    param(
        [Parameter(Mandatory = $true)]
        [ValidateSet("GET", "POST", "PUT", "DELETE")]
        [string]$Method,
        [Parameter(Mandatory = $true)]
        [string]$BaseUrl,
        [Parameter(Mandatory = $true)]
        [string]$RealmName,
        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string]$Path,
        [Parameter(Mandatory = $true)]
        [string]$Token,
        [object]$Body,
        [switch]$AllowNotFound,
        [int]$JsonDepth = 100
    )

    $headers = @{
        Authorization = "Bearer $Token"
    }
    $uri = "$BaseUrl/admin/realms/$RealmName/$Path"

    try {
        if ($PSBoundParameters.ContainsKey("Body")) {
            $jsonBody = $Body | ConvertTo-Json -Depth $JsonDepth -Compress

            $response = Invoke-RestMethod `
                -Method $Method `
                -Uri $uri `
                -Headers $headers `
                -ContentType "application/json" `
                -Body $jsonBody
        }
        else {
            $response = Invoke-RestMethod `
                -Method $Method `
                -Uri $uri `
                -Headers $headers
        }
    }
    catch {
        $response = $_.Exception.Response

        if ($AllowNotFound -and $null -ne $response -and [int]$response.StatusCode -eq 404) {
            return $null
        }

        if ($null -ne $response) {
            $reader = New-Object System.IO.StreamReader($response.GetResponseStream())
            $message = $reader.ReadToEnd()
            throw "Keycloak Admin API $Method $uri failed: $message"
        }

        throw
    }

    if ($response -is [System.Array]) {
        $response | ForEach-Object { $_ }
        return
    }

    return $response
}
