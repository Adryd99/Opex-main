param(
  [Parameter(Mandatory = $true)][string]$ProjectId,
  [Parameter(Mandatory = $true)][string]$AppDomain,
  [Parameter(Mandatory = $true)][string]$ApiDomain,
  [Parameter(Mandatory = $true)][string]$AuthDomain,
  [string]$Region = 'us-central1',
  [string]$Repository = 'opex',
  [string]$Tag = 'latest'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..\..')

function Invoke-CloudBuild {
  param(
    [Parameter(Mandatory = $true)][string]$Config,
    [string]$ExtraSubstitutions = ''
  )

  $baseSubstitutions = "_REGION=$Region,_REPOSITORY=$Repository,_TAG=$Tag"
  $substitutions = if ($ExtraSubstitutions) {
    "$baseSubstitutions,$ExtraSubstitutions"
  } else {
    $baseSubstitutions
  }

  $arguments = @(
    'builds', 'submit', $root,
    '--project', $ProjectId,
    '--config', $Config,
    '--substitutions', $substitutions
  )

  & gcloud @arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Cloud Build failed for $Config"
  }
}

Push-Location $root
try {
  Invoke-CloudBuild -Config 'cloudbuild-auth.yaml'
  Invoke-CloudBuild -Config 'cloudbuild-api.yaml'
  Invoke-CloudBuild -Config 'cloudbuild-web.yaml' -ExtraSubstitutions (
    "_BUILD_API_BASE_URL=https://$ApiDomain," +
    "_BUILD_API_ORIGIN=https://$ApiDomain," +
    "_BUILD_IDP_LOGIN_URL=https://$AuthDomain/realms/opex/protocol/openid-connect/auth," +
    "_BUILD_IDP_EXCHANGE_URL=https://$AuthDomain/realms/opex/protocol/openid-connect/token," +
    "_BUILD_KEYCLOAK_LOGOUT_URL=https://$AuthDomain/realms/opex/protocol/openid-connect/logout," +
    "_BUILD_KEYCLOAK_CLIENT_ID=opex," +
    "_BUILD_KEYCLOAK_SCOPE=openid profile email," +
    "_BUILD_KEYCLOAK_REDIRECT_URI=https://$AppDomain"
  )
}
finally {
  Pop-Location
}
