param(
  [string]$ProjectId,
  [string]$Region = 'us-central1',
  [string]$Repository = 'opex',
  [string]$ServiceName = 'opex-web',
  [string]$ImageTag = 'latest',
  [int]$MaxInstances = 2,
  [string]$ConfigFile = (Join-Path $PSScriptRoot 'env.web'),
  [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'lib\EnvFile.ps1')

$providedParameters = @{} + $PSBoundParameters
$configValues = Import-EnvFile -Path $ConfigFile -Optional

function Resolve-Setting {
  param(
    [Parameter(Mandatory = $true)][string]$ParameterName,
    [Parameter(Mandatory = $true)][string]$ConfigKey,
    [AllowEmptyString()]
    [Parameter(Mandatory = $true)][string]$DefaultValue
  )

  if ($providedParameters.ContainsKey($ParameterName)) {
    return [string](Get-Variable -Name $ParameterName -ValueOnly)
  }

  if ($configValues.ContainsKey($ConfigKey) -and -not [string]::IsNullOrWhiteSpace([string]$configValues[$ConfigKey])) {
    return [string]$configValues[$ConfigKey]
  }

  return $DefaultValue
}

function Resolve-IntSetting {
  param(
    [Parameter(Mandatory = $true)][string]$ParameterName,
    [Parameter(Mandatory = $true)][string]$ConfigKey,
    [Parameter(Mandatory = $true)][int]$DefaultValue
  )

  return [int](Resolve-Setting -ParameterName $ParameterName -ConfigKey $ConfigKey -DefaultValue "$DefaultValue")
}

function Assert-RequiredSetting {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Value,
    [Parameter(Mandatory = $true)][string]$ConfigKey,
    [Parameter(Mandatory = $true)][string]$SourcePath
  )

  if ([string]::IsNullOrWhiteSpace($Value)) {
    throw "$Name is required. Pass -$Name or set $ConfigKey in $SourcePath."
  }
}

$ProjectId = Resolve-Setting -ParameterName 'ProjectId' -ConfigKey 'PROJECT_ID' -DefaultValue ''
$Region = Resolve-Setting -ParameterName 'Region' -ConfigKey 'REGION' -DefaultValue $Region
$Repository = Resolve-Setting -ParameterName 'Repository' -ConfigKey 'REPOSITORY' -DefaultValue $Repository
$ServiceName = Resolve-Setting -ParameterName 'ServiceName' -ConfigKey 'SERVICE_NAME' -DefaultValue $ServiceName
$ImageTag = Resolve-Setting -ParameterName 'ImageTag' -ConfigKey 'IMAGE_TAG' -DefaultValue $ImageTag
$MaxInstances = Resolve-IntSetting -ParameterName 'MaxInstances' -ConfigKey 'MAX_INSTANCES' -DefaultValue $MaxInstances

Assert-RequiredSetting -Name 'ProjectId' -Value $ProjectId -ConfigKey 'PROJECT_ID' -SourcePath $ConfigFile

$image = "$Region-docker.pkg.dev/$ProjectId/$Repository/${ServiceName}:$ImageTag"
$arguments = @(
  'run', 'deploy', $ServiceName,
  '--project', $ProjectId,
  '--region', $Region,
  '--image', $image,
  '--allow-unauthenticated',
  '--port', '8080',
  '--cpu', '1',
  '--memory', '512Mi',
  '--timeout', '60',
  '--min-instances', '0',
  '--max-instances', "$MaxInstances"
)

if ($DryRun) {
  Write-Host "[DryRun] gcloud $($arguments -join ' ')" -ForegroundColor Yellow
  return
}

& gcloud @arguments
if ($LASTEXITCODE -ne 0) {
  throw "Cloud Run deploy failed for $ServiceName"
}
