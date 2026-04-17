param(
  [Parameter(Mandatory = $true)][string]$ProjectId,
  [string]$Region = 'us-central1',
  [string]$Repository = 'opex',
  [string]$ServiceName = 'opex-web',
  [string]$ImageTag = 'latest',
  [int]$MaxInstances = 2
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

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

& gcloud @arguments
if ($LASTEXITCODE -ne 0) {
  throw "Cloud Run deploy failed for $ServiceName"
}
