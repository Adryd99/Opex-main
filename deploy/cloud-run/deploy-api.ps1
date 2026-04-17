param(
  [Parameter(Mandatory = $true)][string]$ProjectId,
  [Parameter(Mandatory = $true)][string]$AppDomain,
  [Parameter(Mandatory = $true)][string]$AuthDomain,
  [Parameter(Mandatory = $true)][string]$Network,
  [Parameter(Mandatory = $true)][string]$Subnet,
  [Parameter(Mandatory = $true)][string]$DatabaseHost,
  [string]$Region = 'us-central1',
  [string]$Repository = 'opex',
  [string]$ServiceName = 'opex-api',
  [string]$ImageTag = 'latest',
  [int]$DatabasePort = 5432,
  [string]$DatabaseName = 'opexdb',
  [string]$DatabaseUser = 'opex',
  [int]$MaxInstances = 4,
  [string]$AppDatabasePasswordSecret = 'APP_PG_PASSWORD',
  [string]$KeycloakAdminUserSecret = 'KC_ADMIN',
  [string]$KeycloakAdminPasswordSecret = 'KC_ADMIN_PW',
  [string]$SaltEdgeAppIdSecret = 'SALTEDGE_APP_ID',
  [string]$SaltEdgeSecretSecret = 'SALTEDGE_SECRET'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$image = "$Region-docker.pkg.dev/$ProjectId/$Repository/${ServiceName}:$ImageTag"
$envVars = @(
  "APP_PG_HOST=$DatabaseHost",
  "APP_PG_PORT=$DatabasePort",
  "APP_PG_DB=$DatabaseName",
  "APP_PG_USER=$DatabaseUser",
  "APP_CORS_ALLOWED_ORIGIN_PATTERNS=https://$AppDomain,http://localhost:*,http://127.0.0.1:*",
  "KEYCLOAK_ISSUER_URI=https://$AuthDomain/realms/opex",
  "KEYCLOAK_SERVER_URL=https://$AuthDomain",
  "KEYCLOAK_ADMIN_REALM=master",
  "KEYCLOAK_ADMIN_CLIENT_ID=admin-cli",
  "KEYCLOAK_TARGET_REALM=opex",
  "SALTEDGE_RETURN_TO_URL=https://$AppDomain/success"
)
$secrets = @(
  "APP_PG_PASSWORD=${AppDatabasePasswordSecret}:latest",
  "KC_ADMIN=${KeycloakAdminUserSecret}:latest",
  "KC_ADMIN_PW=${KeycloakAdminPasswordSecret}:latest",
  "SALTEDGE_APP_ID=${SaltEdgeAppIdSecret}:latest",
  "SALTEDGE_SECRET=${SaltEdgeSecretSecret}:latest"
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
  '--set-env-vars', ("^@^" + ($envVars -join '@')),
  '--update-secrets', ($secrets -join ',')
)

& gcloud @arguments
if ($LASTEXITCODE -ne 0) {
  throw "Cloud Run deploy failed for $ServiceName"
}
