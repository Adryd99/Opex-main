param(
  [Parameter(Mandatory = $true)][string]$ProjectId,
  [Parameter(Mandatory = $true)][string]$AppDomain,
  [Parameter(Mandatory = $true)][string]$AuthDomain,
  [Parameter(Mandatory = $true)][string]$Network,
  [Parameter(Mandatory = $true)][string]$Subnet,
  [Parameter(Mandatory = $true)][string]$DatabaseHost,
  [string]$Region = 'us-central1',
  [string]$Repository = 'opex',
  [string]$ServiceName = 'opex-auth',
  [string]$ImageTag = 'latest',
  [int]$DatabasePort = 5432,
  [string]$DatabaseName = 'keycloak',
  [string]$DatabaseUser = 'keycloak',
  [int]$MaxInstances = 2,
  [string]$BootstrapAdminUserSecret = 'KC_ADMIN',
  [string]$BootstrapAdminPasswordSecret = 'KC_ADMIN_PW',
  [string]$DatabasePasswordSecret = 'KEYCLOAK_DB_PASSWORD'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$image = "$Region-docker.pkg.dev/$ProjectId/$Repository/${ServiceName}:$ImageTag"
$envVars = @(
  'KC_DB=postgres',
  "KC_DB_URL=jdbc:postgresql://${DatabaseHost}:$DatabasePort/$DatabaseName",
  "KC_DB_USERNAME=$DatabaseUser",
  "KC_HOSTNAME=https://$AuthDomain",
  "OPEX_APP_ORIGIN=https://$AppDomain",
  "OPEX_APP_ORIGIN_WILDCARD=https://$AppDomain/*",
  'KC_LOG_LEVEL=INFO'
)
$secrets = @(
  "KC_BOOTSTRAP_ADMIN_USERNAME=${BootstrapAdminUserSecret}:latest",
  "KC_BOOTSTRAP_ADMIN_PASSWORD=${BootstrapAdminPasswordSecret}:latest",
  "KC_DB_PASSWORD=${DatabasePasswordSecret}:latest"
)

$arguments = @(
  'run', 'deploy', $ServiceName,
  '--project', $ProjectId,
  '--region', $Region,
  '--image', $image,
  '--allow-unauthenticated',
  '--port', '8080',
  '--cpu', '1',
  '--memory', '1Gi',
  '--timeout', '300',
  '--min-instances', '0',
  '--max-instances', "$MaxInstances",
  '--network', $Network,
  '--subnet', $Subnet,
  '--vpc-egress', 'private-ranges-only',
  '--set-env-vars', ($envVars -join ','),
  '--update-secrets', ($secrets -join ',')
)

& gcloud @arguments
if ($LASTEXITCODE -ne 0) {
  throw "Cloud Run deploy failed for $ServiceName"
}
