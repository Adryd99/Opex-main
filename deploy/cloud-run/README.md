# Cloud Run Deployment

This runbook is intended to be reusable for the next real production deploy.

The values below describe the current clean deploy only as a working example.
Do not copy them blindly into the next stack. For a new go-live, start from:

- `deploy/cloud-run/templates/env.stack.example`
- `deploy/cloud-run/templates/env.secrets.example`
- `deploy/cloud-run/templates/env.auth.example`
- `deploy/cloud-run/templates/env.auth.secrets.example`
- `deploy/cloud-run/templates/env.api.example`
- `deploy/cloud-run/templates/env.api.secrets.example`
- `deploy/cloud-run/templates/env.web.example`

Current clean deploy example:

- `PROJECT_ID=opex-v2-493902`
- `REGION=europe-west1`
- `REPOSITORY=opex`
- `NETWORK=opex-v2-vpc`
- `SUBNET=opex-v2-europe-west1`
- `SUBNET_RANGE=10.20.0.0/24`
- `APP_DOMAIN=opes.dani.host`
- `API_DOMAIN=api.opes.dani.host`
- `AUTH_DOMAIN=auth.opes.dani.host`
- `SQL_INSTANCE=opex-v2-pg`
- `APP_DB=opexdb`
- `APP_DB_USER=opex`
- `KEYCLOAK_DB=keycloak`
- `KEYCLOAK_DB_USER=keycloak`

Low-cost target setup:

- `opex-web` on Cloud Run
- `opex-api` on Cloud Run
- `opex-auth` on Cloud Run
- one Cloud SQL PostgreSQL instance
  - `opexdb`
  - `keycloak`
- Artifact Registry for images
- Secret Manager for sensitive values

## What Bootstraps Automatically

- Cloud SQL only hosts the instance, databases, and users.
- `opex-auth` creates Keycloak tables and imports `auth/realm/production/opex-realm.json`.
- `opex-api` creates or updates its schema because `spring.jpa.hibernate.ddl-auto=update`.

No manual SQL import is needed for the first deploy.

## Files In This Folder

- `build-images.ps1`: builds and pushes all three images
- `generate-deploy-env.ps1`: generates deploy-ready env files from `local/stack.local` and `local/secrets.local`
- `preflight-stack.ps1`: validates local templates and runs dry-run checks for the full production stack
- `deploy-auth.ps1`: deploys Keycloak
- `apply-auth-production-settings.ps1`: applies production realm settings to Keycloak via Admin API after deploy
- `deploy-api.ps1`: deploys the API
- `deploy-web.ps1`: deploys the frontend
- `build/`: Cloud Build definitions used by `build-images.ps1`
- `templates/`: versioned templates committed to git
- `local/`: local-only planning files and generated deploy files

For auth, the deploy scripts read:

- `deploy/cloud-run/local/env.auth`
- `deploy/cloud-run/local/env.auth.secrets`

For the backend API, the deploy script reads:

- `deploy/cloud-run/local/env.api`
- `deploy/cloud-run/local/env.api.secrets`

For the frontend web app, the production build/deploy reads:

- `deploy/cloud-run/local/env.web`

Ignored local-only helpers used during real deploys:

- `deploy/cloud-run/local/stack.local`
- `deploy/cloud-run/local/secrets.local`

The `templates/*.example` files are templates only.
The generated deploy files in `local/` should not be committed.

There is intentionally no `env.web.secrets` file.
The browser bundle must not contain passwords or secret tokens.

## Before You Start

For a brand-new deployment, decide these values before touching GCloud:

- `PROJECT_ID`
- `REGION`
- `REPOSITORY`
- `NETWORK`
- `SUBNET`
- `SUBNET_RANGE`
- `BASE_DOMAIN`
- `APP_DOMAIN`
- `API_DOMAIN`
- `AUTH_DOMAIN`
- `SQL_INSTANCE`
- `APP_DB`
- `APP_DB_USER`
- `KEYCLOAK_DB`
- `KEYCLOAK_DB_USER`
- `REALM`
- `WEB_CLIENT_ID`

And prepare the real secret values locally first:

- `APP_PG_PASSWORD`
- `KEYCLOAK_DB_PASSWORD`
- `POSTGRES_SUPERUSER_PASSWORD`
- `KC_ADMIN`
- `KC_ADMIN_PW`
- `SALTEDGE_APP_ID`
- `SALTEDGE_SECRET`
- `OPEX_SMTP_USERNAME`
- `OPEX_SMTP_PASSWORD`
- `OPEX_GOOGLE_CLIENT_ID`
- `OPEX_GOOGLE_CLIENT_SECRET`

Recommended workflow:

1. Copy `templates/env.stack.example` to `local/stack.local` and fill it in.
2. Copy `templates/env.secrets.example` to `local/secrets.local` and fill it in.
3. Run `generate-deploy-env.ps1`.
4. Review the generated files in `local/`.
5. Only then run preflight and deploy.

## Secrets Used By Default

- `APP_PG_PASSWORD`
- `KEYCLOAK_DB_PASSWORD`
- `KC_ADMIN`
- `KC_ADMIN_PW`
- `SALTEDGE_APP_ID`
- `SALTEDGE_SECRET`

Additional recommended auth secrets:

- `OPEX_SMTP_USERNAME`
- `OPEX_SMTP_PASSWORD`
- `OPEX_GOOGLE_CLIENT_ID`
- `OPEX_GOOGLE_CLIENT_SECRET`

## Short Runbook

Use PowerShell on Windows.

```powershell
cd C:\Users\danie\workspace\Opex\Opex-main
gcloud auth login
gcloud auth application-default login
```

Set global variables:

```powershell
$PROJECT_ID = "opex-v2-493902"
$REGION = "europe-west1"
$REPOSITORY = "opex"

$NETWORK = "opex-v2-vpc"
$SUBNET = "opex-v2-europe-west1"
$SUBNET_RANGE = "10.20.0.0/24"

$BASE_DOMAIN = "dani.host"
$APP_DOMAIN = "opes.dani.host"
$API_DOMAIN = "api.opes.dani.host"
$AUTH_DOMAIN = "auth.opes.dani.host"

$SQL_INSTANCE = "opex-v2-pg"
$APP_DB = "opexdb"
$APP_DB_USER = "opex"
$KEYCLOAK_DB = "keycloak"
$KEYCLOAK_DB_USER = "keycloak"
```

Configure `gcloud`:

```powershell
gcloud config set project $PROJECT_ID
gcloud config set run/region $REGION
gcloud auth application-default set-quota-project $PROJECT_ID
```

Prepare deploy files:

```powershell
Copy-Item .\deploy\cloud-run\templates\env.stack.example .\deploy\cloud-run\local\stack.local
Copy-Item .\deploy\cloud-run\templates\env.secrets.example .\deploy\cloud-run\local\secrets.local
```

Then edit:

- `deploy/cloud-run/local/stack.local`
- `deploy/cloud-run/local/secrets.local`

Then generate the deploy-ready files:

```powershell
.\deploy\cloud-run\generate-deploy-env.ps1
```

This writes:

- `deploy/cloud-run/local/env.auth`
- `deploy/cloud-run/local/env.auth.secrets`
- `deploy/cloud-run/local/env.api`
- `deploy/cloud-run/local/env.api.secrets`
- `deploy/cloud-run/local/env.web`

`local/stack.local` is the single planning file for project, domains, network, database names, SMTP metadata, and legal/public config.
`local/secrets.local` is the single planning file for the real secret values that you will later copy to Secret Manager.
The generated files in `local/` are technical inputs for the deploy scripts.

Run the full preflight before any real production deploy:

```powershell
.\deploy\cloud-run\preflight-stack.ps1
```

If you want to validate the repository templates only:

```powershell
.\deploy\cloud-run\preflight-stack.ps1 -UseExamplesOnly
```

Enable APIs:

```powershell
gcloud services enable `
  run.googleapis.com `
  artifactregistry.googleapis.com `
  cloudbuild.googleapis.com `
  sqladmin.googleapis.com `
  secretmanager.googleapis.com `
  compute.googleapis.com `
  servicenetworking.googleapis.com
```

## Domain Verification Rule

If your base domain is not already verified in Google, verify it first:

```powershell
gcloud domains verify $BASE_DOMAIN
gcloud domains list-user-verified
```

If you are deploying under subdomains of a base domain that is already verified, you can skip that step.
The current production deploy uses `opes.dani.host`, `api.opes.dani.host`, and `auth.opes.dani.host` under the already verified base domain `dani.host`.

## Infrastructure

Create Artifact Registry:

```powershell
gcloud artifacts repositories create $REPOSITORY `
  --repository-format=docker `
  --location=$REGION `
  --description="Opex containers"
```

Create network and subnet:

```powershell
gcloud compute networks create $NETWORK --subnet-mode=custom

gcloud compute networks subnets create $SUBNET `
  --network=$NETWORK `
  --region=$REGION `
  --range=$SUBNET_RANGE
```

Create private services access:

```powershell
gcloud compute addresses create google-managed-services-$NETWORK `
  --global `
  --purpose=VPC_PEERING `
  --prefix-length=16 `
  --network=$NETWORK

gcloud services vpc-peerings connect `
  --service=servicenetworking.googleapis.com `
  --ranges=google-managed-services-$NETWORK `
  --network=$NETWORK
```

Create Cloud SQL:

```powershell
gcloud sql instances create $SQL_INSTANCE `
  --database-version=POSTGRES_15 `
  --region=$REGION `
  --tier=db-g1-small `
  --network=projects/$PROJECT_ID/global/networks/$NETWORK `
  --no-assign-ip `
  --storage-type=HDD `
  --storage-size=10
```

Set the `postgres` password, create databases, and create users:

```powershell
$POSTGRES_PASSWORD = Read-Host "Password for postgres user"
gcloud sql users set-password postgres `
  --instance=$SQL_INSTANCE `
  --password="$POSTGRES_PASSWORD"

gcloud sql databases create $APP_DB --instance=$SQL_INSTANCE
gcloud sql databases create $KEYCLOAK_DB --instance=$SQL_INSTANCE

$APP_DB_PASSWORD = Read-Host "Password for APP_PG_PASSWORD"
$KEYCLOAK_DB_PASSWORD = Read-Host "Password for KEYCLOAK_DB_PASSWORD"

gcloud sql users create $APP_DB_USER `
  --instance=$SQL_INSTANCE `
  --password="$APP_DB_PASSWORD"

gcloud sql users create $KEYCLOAK_DB_USER `
  --instance=$SQL_INSTANCE `
  --password="$KEYCLOAK_DB_PASSWORD"
```

Read the private DB IP:

```powershell
gcloud sql instances describe $SQL_INSTANCE --format="json(ipAddresses)"
```

Then update:

- `SQL_PRIVATE_IP` in `deploy/cloud-run/local/stack.local`

Then regenerate:

```powershell
.\deploy\cloud-run\generate-deploy-env.ps1
```

Example from the current stack:

```powershell
$CLOUD_SQL_PRIVATE_IP = "172.18.0.3"
```

Create the non-DB secret values:

```powershell
$KC_ADMIN = Read-Host "Keycloak bootstrap admin username"
$KC_ADMIN_PW = Read-Host "Keycloak bootstrap admin password"
$SALTEDGE_APP_ID = Read-Host "Salt Edge app id"
$SALTEDGE_SECRET = Read-Host "Salt Edge secret"
```

Create or update secrets using temp files, not PowerShell piping:

```powershell
$tmp = New-TemporaryFile
$tmpPath = $tmp.FullName
[System.IO.File]::WriteAllText($tmpPath, $APP_DB_PASSWORD)
gcloud secrets create APP_PG_PASSWORD --data-file="$tmpPath"
Remove-Item $tmpPath
```

If the secret already exists, use:

```powershell
gcloud secrets versions add SECRET_NAME --data-file="C:\path\to\temp-file"
```

Grant runtime access to secrets:

```powershell
$PROJECT_NUMBER = gcloud projects describe $PROJECT_ID --format="value(projectNumber)"
$RUNTIME_SA = "$PROJECT_NUMBER-compute@developer.gserviceaccount.com"

gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:$RUNTIME_SA" `
  --role="roles/secretmanager.secretAccessor"
```

If your project policies do not allow using the default compute service account as the Cloud Run runtime identity, create a dedicated runtime service account and use that instead for `opex-auth` and `opex-api`.

## Build And Deploy Order

Build images:

```powershell
.\deploy\cloud-run\build-images.ps1 `
  -WebConfigFile .\deploy\cloud-run\local\env.web
```

Deploy services:

```powershell
.\deploy\cloud-run\deploy-auth.ps1 `
  -ConfigFile .\deploy\cloud-run\local\env.auth `
  -SecretsFile .\deploy\cloud-run\local\env.auth.secrets

.\deploy\cloud-run\deploy-api.ps1 `
  -ConfigFile .\deploy\cloud-run\local\env.api `
  -SecretsFile .\deploy\cloud-run\local\env.api.secrets

.\deploy\cloud-run\deploy-web.ps1 `
  -ConfigFile .\deploy\cloud-run\local\env.web
```

Important:

- `env.web` values are baked into the frontend image.
- If `APP_DOMAIN`, `API_DOMAIN`, or `AUTH_DOMAIN` changes, rebuild the web image before redeploying `opex-web`.

## Domain Mapping

Create domain mappings:

```powershell
gcloud beta run domain-mappings create `
  --service=opex-web `
  --domain=$APP_DOMAIN `
  --region=$REGION

gcloud beta run domain-mappings create `
  --service=opex-api `
  --domain=$API_DOMAIN `
  --region=$REGION

gcloud beta run domain-mappings create `
  --service=opex-auth `
  --domain=$AUTH_DOMAIN `
  --region=$REGION
```

Read the DNS records:

```powershell
gcloud beta run domain-mappings describe --domain=$APP_DOMAIN --region=$REGION
gcloud beta run domain-mappings describe --domain=$API_DOMAIN --region=$REGION
gcloud beta run domain-mappings describe --domain=$AUTH_DOMAIN --region=$REGION
```

For the current setup, the mappings resolve to `ghs.googlehosted.com.`.
For a new stack, always trust the output of `gcloud beta run domain-mappings describe` and publish the exact records it returns.

Wait until the domain mappings report `Ready=True` before the next step.

## Auth Production Settings

Once the final auth domain is live, apply production auth settings:

```powershell
.\deploy\cloud-run\apply-auth-production-settings.ps1 `
  -ConfigFile .\deploy\cloud-run\local\env.auth `
  -SecretsFile .\deploy\cloud-run\local\env.auth.secrets `
  -ApplySmtp `
  -ApplyGoogleIdp
```

This script reads the sensitive values from Secret Manager and writes them to the Keycloak realm through the Admin API.

If your local TLS stack cannot reach the custom auth domain yet, you can temporarily target the Cloud Run hostname for the Admin API call only:

```powershell
.\deploy\cloud-run\apply-auth-production-settings.ps1 `
  -ConfigFile .\deploy\cloud-run\local\env.auth `
  -SecretsFile .\deploy\cloud-run\local\env.auth.secrets `
  -AuthDomain opex-auth-504598836630.europe-west1.run.app `
  -ApplySmtp `
  -ApplyGoogleIdp
```

That workaround only changes the Admin API endpoint used by the script. It does not change the public Keycloak hostname configured in the service.

## Google OAuth Console

After the auth domain is decided, update the Google OAuth client:

- Authorized JavaScript origins:
  - `https://$AUTH_DOMAIN`
- Authorized redirect URIs:
  - `https://$AUTH_DOMAIN/realms/opex/broker/google/endpoint`

If the auth domain changes later, update these values again before testing Google login.

## Real Go-Live Checklist

Before calling the deployment truly live, confirm all of these:

- `APP_DOMAIN`, `API_DOMAIN`, and `AUTH_DOMAIN` are the final production domains
- Salt Edge credentials are the final production credentials
- Google OAuth values are updated for the final auth domain
- SMTP credentials are real production credentials
- `LEGAL_*` values in `deploy/cloud-run/local/stack.local` are final and not placeholders
- Secret values exist in Secret Manager for the target project
- Domain mappings are `Ready=True`
- End-to-end login works with the final domains
- Open Banking redirect returns to the final app domain
- Any secret ever shared insecurely has been rotated before go-live

## Smoke Tests

Control plane:

```powershell
gcloud run services describe opex-web --region=$REGION
gcloud run services describe opex-api --region=$REGION
gcloud run services describe opex-auth --region=$REGION

gcloud beta run domain-mappings list --region=$REGION
```

User-facing URLs:

- `https://$APP_DOMAIN`
- `https://$API_DOMAIN/api/legal/public`
- `https://$AUTH_DOMAIN`

## Go-Live Notes

- Replace placeholder `LEGAL_*` values in `deploy/cloud-run/local/stack.local` before a real go-live.
- Keep `deploy/cloud-run/local/stack.local` and `deploy/cloud-run/local/secrets.local` local only.
- If any secret was ever pasted in chat or shared insecurely, rotate it before production use.

## Recovery Note

`deploy-auth.ps1` supports `-DatabaseName`.

That matters if you ever need to move Keycloak to a fresh Cloud SQL database without editing the script again. Example:

```powershell
.\deploy\cloud-run\deploy-auth.ps1 `
  -ProjectId $PROJECT_ID `
  -Region $REGION `
  -AppDomain $APP_DOMAIN `
  -Network $NETWORK `
  -Subnet $SUBNET `
  -AuthDomain $AUTH_DOMAIN `
  -DatabaseHost $CLOUD_SQL_PRIVATE_IP `
  -DatabaseName keycloak_v2
```
