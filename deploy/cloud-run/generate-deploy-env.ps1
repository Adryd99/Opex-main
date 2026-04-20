param(
  [string]$StackFile = '',
  [string]$SecretsFile = '',
  [string]$OutputDirectory = '',
  [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'lib\EnvFile.ps1')

$StackFile = Resolve-DeployPath -ProvidedPath $StackFile -DefaultPaths @(
  (Join-Path $PSScriptRoot 'local\stack.local')
)
$SecretsFile = Resolve-DeployPath -ProvidedPath $SecretsFile -DefaultPaths @(
  (Join-Path $PSScriptRoot 'local\secrets.local')
)

if ([string]::IsNullOrWhiteSpace($OutputDirectory)) {
  $OutputDirectory = Join-Path $PSScriptRoot 'local'
}

$stackValues = Import-EnvFile -Path $StackFile
$secretValues = Import-EnvFile -Path $SecretsFile

function Get-RequiredValue {
  param(
    [Parameter(Mandatory = $true)][hashtable]$Values,
    [Parameter(Mandatory = $true)][string]$Key
  )

  if (-not $Values.ContainsKey($Key) -or [string]::IsNullOrWhiteSpace([string]$Values[$Key])) {
    throw "Missing required value '$Key' in $StackFile."
  }

  return [string]$Values[$Key]
}

function Get-OptionalValue {
  param(
    [Parameter(Mandatory = $true)][hashtable]$Values,
    [Parameter(Mandatory = $true)][string]$Key,
    [AllowEmptyString()]
    [Parameter(Mandatory = $true)][string]$DefaultValue
  )

  if ($Values.ContainsKey($Key) -and -not [string]::IsNullOrWhiteSpace([string]$Values[$Key])) {
    return [string]$Values[$Key]
  }

  return $DefaultValue
}

function Has-SecretValue {
  param(
    [Parameter(Mandatory = $true)][string]$Key
  )

  return $secretValues.ContainsKey($Key) -and -not [string]::IsNullOrWhiteSpace([string]$secretValues[$Key])
}

$projectId = Get-RequiredValue -Values $stackValues -Key 'PROJECT_ID'
$region = Get-OptionalValue -Values $stackValues -Key 'REGION' -DefaultValue 'europe-west1'
$repository = Get-OptionalValue -Values $stackValues -Key 'REPOSITORY' -DefaultValue 'opex'
$network = Get-RequiredValue -Values $stackValues -Key 'NETWORK'
$subnet = Get-RequiredValue -Values $stackValues -Key 'SUBNET'
$appDomain = Get-RequiredValue -Values $stackValues -Key 'APP_DOMAIN'
$apiDomain = Get-RequiredValue -Values $stackValues -Key 'API_DOMAIN'
$authDomain = Get-RequiredValue -Values $stackValues -Key 'AUTH_DOMAIN'
$sqlPrivateIp = Get-RequiredValue -Values $stackValues -Key 'SQL_PRIVATE_IP'
$appDb = Get-OptionalValue -Values $stackValues -Key 'APP_DB' -DefaultValue 'opexdb'
$appDbUser = Get-OptionalValue -Values $stackValues -Key 'APP_DB_USER' -DefaultValue 'opex'
$keycloakDb = Get-OptionalValue -Values $stackValues -Key 'KEYCLOAK_DB' -DefaultValue 'keycloak'
$keycloakDbUser = Get-OptionalValue -Values $stackValues -Key 'KEYCLOAK_DB_USER' -DefaultValue 'keycloak'
$realm = Get-OptionalValue -Values $stackValues -Key 'REALM' -DefaultValue 'opex'
$webClientId = Get-OptionalValue -Values $stackValues -Key 'WEB_CLIENT_ID' -DefaultValue 'opex'

$authMaxInstances = Get-OptionalValue -Values $stackValues -Key 'AUTH_MAX_INSTANCES' -DefaultValue '2'
$apiMaxInstances = Get-OptionalValue -Values $stackValues -Key 'API_MAX_INSTANCES' -DefaultValue '4'
$webMaxInstances = Get-OptionalValue -Values $stackValues -Key 'WEB_MAX_INSTANCES' -DefaultValue '2'
$imageTag = Get-OptionalValue -Values $stackValues -Key 'IMAGE_TAG' -DefaultValue 'latest'

$smtpHost = Get-OptionalValue -Values $stackValues -Key 'OPEX_SMTP_HOST' -DefaultValue ''
$smtpPort = Get-OptionalValue -Values $stackValues -Key 'OPEX_SMTP_PORT' -DefaultValue '587'
$smtpFrom = Get-OptionalValue -Values $stackValues -Key 'OPEX_SMTP_FROM' -DefaultValue ''
$smtpFromDisplayName = Get-OptionalValue -Values $stackValues -Key 'OPEX_SMTP_FROM_DISPLAY_NAME' -DefaultValue 'Opex'
$smtpEncryption = Get-OptionalValue -Values $stackValues -Key 'OPEX_SMTP_ENCRYPTION' -DefaultValue 'StartTLS'
$smtpUseAuthentication = Get-OptionalValue -Values $stackValues -Key 'OPEX_SMTP_USE_AUTHENTICATION' -DefaultValue 'true'

$appUserDefaultVatFrequency = Get-OptionalValue -Values $stackValues -Key 'APP_USER_DEFAULT_VAT_FREQUENCY' -DefaultValue 'Yearly'
$keycloakVerifyEmailLifespanSeconds = Get-OptionalValue -Values $stackValues -Key 'KEYCLOAK_VERIFY_EMAIL_LIFESPAN_SECONDS' -DefaultValue '43200'

$legalDefaults = [ordered]@{
  LEGAL_CONTROLLER_NAME = 'Your legal entity name'
  LEGAL_CONTROLLER_ADDRESS = 'Set your production legal address'
  LEGAL_PRIVACY_EMAIL = 'privacy@example.com'
  LEGAL_DPO_EMAIL = 'dpo@example.com'
  LEGAL_SUPPORT_EMAIL = 'support@example.com'
  LEGAL_SUPERVISORY_AUTHORITY = 'Set your production supervisory authority'
  LEGAL_POLICY_LAST_UPDATED = '2026-04-20'
  LEGAL_PRIVACY_VERSION = '2026-04-20'
  LEGAL_TERMS_VERSION = '2026-04-20'
  LEGAL_COOKIE_VERSION = '2026-04-20'
  LEGAL_OPEN_BANKING_VERSION = '2026-04-20'
  LEGAL_RETENTION_ACTIVE_ACCOUNT = 'Retained while the account stays active and for up to 30 days after closure unless a longer statutory period applies.'
  LEGAL_RETENTION_CLOSED_ACCOUNT = 'Core billing, financial or tax records may be retained for the period required by applicable accounting and tax laws.'
  LEGAL_RETENTION_OPEN_BANKING = 'Retained while the related connection stays active and then removed or anonymized according to closure and statutory retention rules.'
  LEGAL_RETENTION_CONSENT_AUDIT = 'Retained for the lifetime of the account and for up to 6 years after closure to evidence policy acceptance history where needed.'
}

$authConfig = [ordered]@{
  PROJECT_ID = $projectId
  REGION = $region
  REPOSITORY = $repository
  SERVICE_NAME = 'opex-auth'
  IMAGE_TAG = $imageTag
  MAX_INSTANCES = $authMaxInstances
  NETWORK = $network
  SUBNET = $subnet
  APP_DOMAIN = $appDomain
  API_DOMAIN = $apiDomain
  AUTH_DOMAIN = $authDomain
  KEYCLOAK_DB_HOST = $sqlPrivateIp
  KEYCLOAK_DB_PORT = '5432'
  KEYCLOAK_DB_NAME = $keycloakDb
  KEYCLOAK_DB_USER = $keycloakDbUser
  KC_HOSTNAME = "https://$authDomain"
  KC_LOG_LEVEL = 'INFO'
  KC_HEALTH_ENABLED = 'true'
  KC_METRICS_ENABLED = 'true'
  OPEX_APP_ORIGIN = "https://$appDomain"
  OPEX_APP_ORIGIN_WILDCARD = "https://$appDomain/*"
  OPEX_LEGAL_APP_BASE_URL = "https://$appDomain"
  OPEX_LEGAL_API_PUBLIC_URL = "https://$apiDomain/api/legal/public"
  REALM = $realm
  ADMIN_REALM = 'master'
}

if (-not [string]::IsNullOrWhiteSpace($smtpHost)) {
  $authConfig['OPEX_SMTP_HOST'] = $smtpHost
}

if (-not [string]::IsNullOrWhiteSpace($smtpPort)) {
  $authConfig['OPEX_SMTP_PORT'] = $smtpPort
}

if (-not [string]::IsNullOrWhiteSpace($smtpFrom)) {
  $authConfig['OPEX_SMTP_FROM'] = $smtpFrom
}

if (-not [string]::IsNullOrWhiteSpace($smtpFromDisplayName)) {
  $authConfig['OPEX_SMTP_FROM_DISPLAY_NAME'] = $smtpFromDisplayName
}

if (-not [string]::IsNullOrWhiteSpace($smtpEncryption)) {
  $authConfig['OPEX_SMTP_ENCRYPTION'] = $smtpEncryption
}

if (-not [string]::IsNullOrWhiteSpace($smtpUseAuthentication)) {
  $authConfig['OPEX_SMTP_USE_AUTHENTICATION'] = $smtpUseAuthentication
}

$authSecrets = [ordered]@{
  KC_ADMIN_SECRET = 'KC_ADMIN'
  KC_ADMIN_PASSWORD_SECRET = 'KC_ADMIN_PW'
  KEYCLOAK_DB_PASSWORD_SECRET = 'KEYCLOAK_DB_PASSWORD'
}

if ((Has-SecretValue -Key 'OPEX_SMTP_USERNAME') -or (Has-SecretValue -Key 'OPEX_SMTP_PASSWORD')) {
  $authSecrets['OPEX_SMTP_USERNAME_SECRET'] = 'OPEX_SMTP_USERNAME'
  $authSecrets['OPEX_SMTP_PASSWORD_SECRET'] = 'OPEX_SMTP_PASSWORD'
}

if ((Has-SecretValue -Key 'OPEX_GOOGLE_CLIENT_ID') -or (Has-SecretValue -Key 'OPEX_GOOGLE_CLIENT_SECRET')) {
  $authSecrets['OPEX_GOOGLE_CLIENT_ID_SECRET'] = 'OPEX_GOOGLE_CLIENT_ID'
  $authSecrets['OPEX_GOOGLE_CLIENT_SECRET_SECRET'] = 'OPEX_GOOGLE_CLIENT_SECRET'
}

$apiConfig = [ordered]@{
  PROJECT_ID = $projectId
  REGION = $region
  REPOSITORY = $repository
  SERVICE_NAME = 'opex-api'
  IMAGE_TAG = $imageTag
  MAX_INSTANCES = $apiMaxInstances
  NETWORK = $network
  SUBNET = $subnet
  APP_DOMAIN = $appDomain
  AUTH_DOMAIN = $authDomain
  APP_PG_HOST = $sqlPrivateIp
  APP_PG_PORT = '5432'
  APP_PG_DB = $appDb
  APP_PG_USER = $appDbUser
  APP_CORS_ALLOWED_ORIGIN_PATTERNS = "https://$appDomain,https://$authDomain,http://localhost:*,http://127.0.0.1:*"
  APP_WEB_BASE_URL = "https://$appDomain"
  APP_USER_DEFAULT_VAT_FREQUENCY = $appUserDefaultVatFrequency
  KEYCLOAK_ISSUER_URI = "https://$authDomain/realms/$realm"
  KEYCLOAK_SERVER_URL = "https://$authDomain"
  KEYCLOAK_ADMIN_REALM = 'master'
  KEYCLOAK_ADMIN_CLIENT_ID = 'admin-cli'
  KEYCLOAK_TARGET_REALM = $realm
  KEYCLOAK_WEB_CLIENT_ID = $webClientId
  KEYCLOAK_VERIFY_EMAIL_LIFESPAN_SECONDS = $keycloakVerifyEmailLifespanSeconds
  SALTEDGE_RETURN_TO_URL = "https://$appDomain/success"
}

foreach ($legalKey in $legalDefaults.Keys) {
  $apiConfig[$legalKey] = Get-OptionalValue -Values $stackValues -Key $legalKey -DefaultValue $legalDefaults[$legalKey]
}

$apiSecrets = [ordered]@{
  APP_PG_PASSWORD_SECRET = 'APP_PG_PASSWORD'
  KC_ADMIN_SECRET = 'KC_ADMIN'
  KC_ADMIN_PASSWORD_SECRET = 'KC_ADMIN_PW'
  SALTEDGE_APP_ID_SECRET = 'SALTEDGE_APP_ID'
  SALTEDGE_SECRET_SECRET = 'SALTEDGE_SECRET'
}

$webConfig = [ordered]@{
  PROJECT_ID = $projectId
  REGION = $region
  REPOSITORY = $repository
  SERVICE_NAME = 'opex-web'
  IMAGE_TAG = $imageTag
  MAX_INSTANCES = $webMaxInstances
  APP_DOMAIN = $appDomain
  API_DOMAIN = $apiDomain
  AUTH_DOMAIN = $authDomain
  VITE_API_BASE_URL = "https://$apiDomain"
  VITE_API_ORIGIN = "https://$apiDomain"
  VITE_KEYCLOAK_AUTH_URL = "https://$authDomain/realms/$realm/protocol/openid-connect/auth"
  VITE_KEYCLOAK_TOKEN_URL = "https://$authDomain/realms/$realm/protocol/openid-connect/token"
  VITE_KEYCLOAK_LOGOUT_URL = "https://$authDomain/realms/$realm/protocol/openid-connect/logout"
  VITE_KEYCLOAK_CLIENT_ID = $webClientId
  VITE_KEYCLOAK_SCOPE = 'openid profile email'
  VITE_KEYCLOAK_REDIRECT_URI = "https://$appDomain"
}

$outputs = @(
  @{
    Path = Join-Path $OutputDirectory 'env.auth'
    Values = $authConfig
    Header = @(
      '# Auto-generated from local/stack.local by generate-deploy-env.ps1.',
      '# Edit stack.local instead of changing this file by hand.'
    )
  },
  @{
    Path = Join-Path $OutputDirectory 'env.auth.secrets'
    Values = $authSecrets
    Header = @(
      '# Auto-generated from local/secrets.local by generate-deploy-env.ps1.',
      '# Secret names only; real secret values live in Secret Manager.'
    )
  },
  @{
    Path = Join-Path $OutputDirectory 'env.api'
    Values = $apiConfig
    Header = @(
      '# Auto-generated from local/stack.local by generate-deploy-env.ps1.',
      '# Edit stack.local instead of changing this file by hand.'
    )
  },
  @{
    Path = Join-Path $OutputDirectory 'env.api.secrets'
    Values = $apiSecrets
    Header = @(
      '# Auto-generated from local/secrets.local by generate-deploy-env.ps1.',
      '# Secret names only; real secret values live in Secret Manager.'
    )
  },
  @{
    Path = Join-Path $OutputDirectory 'env.web'
    Values = $webConfig
    Header = @(
      '# Auto-generated from local/stack.local by generate-deploy-env.ps1.',
      '# Edit stack.local instead of changing this file by hand.'
    )
  }
)

if ($DryRun) {
  foreach ($output in $outputs) {
    Write-Host "[DryRun] Would write $($output.Path)" -ForegroundColor Yellow
  }
  return
}

foreach ($output in $outputs) {
  Export-EnvFile -Path $output.Path -Values $output.Values -HeaderLines $output.Header
  Write-Host "Wrote $($output.Path)" -ForegroundColor Green
}
