# Cloud Run Deployment

Low-cost target setup:

- `opex-web` on Cloud Run
- `opex-api` on Cloud Run
- `opex-auth` on Cloud Run
- one Cloud SQL PostgreSQL instance
  - `opexdb`
  - `keycloak`
- Artifact Registry for images
- Secret Manager for sensitive values

Current recommended values:

- `PROJECT_ID=opex-v1-493608`
- `REGION=us-central1`
- `REPOSITORY=opex`
- `NETWORK=opex-vpc`
- `SUBNET=opex-us-central1`
- `SUBNET_RANGE=10.20.0.0/24`
- `APP_DOMAIN=opex.dani.host`
- `API_DOMAIN=api.opex.dani.host`
- `AUTH_DOMAIN=auth.opex.dani.host`

## What Bootstraps Automatically

- Cloud SQL only hosts the instance, databases, and users.
- `opex-auth` creates Keycloak tables and imports `auth/realm/production/opex-realm.json`.
- `opex-api` creates or updates its schema because `spring.jpa.hibernate.ddl-auto=update`.

No manual SQL import is needed for the first deploy.

## Files In This Folder

- `build-images.ps1`: builds and pushes all three images
- `deploy-auth.ps1`: deploys Keycloak
- `deploy-api.ps1`: deploys the API
- `deploy-web.ps1`: deploys the frontend
- `env.api.example`, `env.auth.example`, `env.web.example`: reference-only examples for non-secret values

The `env.*.example` files are documentation only. The current deploy scripts do not read them automatically.

## Secrets Used By Default

- `APP_PG_PASSWORD`
- `KEYCLOAK_DB_PASSWORD`
- `KC_ADMIN`
- `KC_ADMIN_PW`
- `SALTEDGE_APP_ID`
- `SALTEDGE_SECRET`

## Short Runbook

Use PowerShell on Windows.

```powershell
cd C:\Users\danie\workspace\Opex\Opex-main
gcloud auth login
gcloud auth application-default login
```

Set variables:

```powershell
$PROJECT_ID = "opex-v1-493608"
$REGION = "us-central1"
$REPOSITORY = "opex"

$NETWORK = "opex-vpc"
$SUBNET = "opex-us-central1"
$SUBNET_RANGE = "10.20.0.0/24"

$BASE_DOMAIN = "dani.host"
$APP_DOMAIN = "opex.dani.host"
$API_DOMAIN = "api.opex.dani.host"
$AUTH_DOMAIN = "auth.opex.dani.host"

$SQL_INSTANCE = "opex-main-pg"
$APP_DB = "opexdb"
$APP_DB_USER = "opex"
$KEYCLOAK_DB = "keycloak"
$KEYCLOAK_DB_USER = "keycloak"
```

Configure `gcloud`:

```powershell
gcloud config set project $PROJECT_ID
gcloud config set run/region $REGION
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

Verify the base domain in Search Console and add the TXT record on `@`:

```powershell
gcloud domains verify $BASE_DOMAIN
gcloud domains list-user-verified
```

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

Then set:

```powershell
$CLOUD_SQL_PRIVATE_IP = "10.136.0.3"
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

Build images:

```powershell
.\deploy\cloud-run\build-images.ps1 `
  -ProjectId $PROJECT_ID `
  -Region $REGION `
  -Repository $REPOSITORY `
  -AppDomain $APP_DOMAIN `
  -ApiDomain $API_DOMAIN `
  -AuthDomain $AUTH_DOMAIN
```

Deploy services:

```powershell
.\deploy\cloud-run\deploy-auth.ps1 `
  -ProjectId $PROJECT_ID `
  -Region $REGION `
  -AppDomain $APP_DOMAIN `
  -Network $NETWORK `
  -Subnet $SUBNET `
  -AuthDomain $AUTH_DOMAIN `
  -DatabaseHost $CLOUD_SQL_PRIVATE_IP

.\deploy\cloud-run\deploy-api.ps1 `
  -ProjectId $PROJECT_ID `
  -Region $REGION `
  -Network $NETWORK `
  -Subnet $SUBNET `
  -AppDomain $APP_DOMAIN `
  -AuthDomain $AUTH_DOMAIN `
  -DatabaseHost $CLOUD_SQL_PRIVATE_IP

.\deploy\cloud-run\deploy-web.ps1 `
  -ProjectId $PROJECT_ID `
  -Region $REGION
```

If `gcloud beta` is missing:

```powershell
gcloud components install beta
```

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

For the current setup, add:

- `opex` -> `CNAME` -> `ghs.googlehosted.com.`
- `api.opex` -> `CNAME` -> `ghs.googlehosted.com.`
- `auth.opex` -> `CNAME` -> `ghs.googlehosted.com.`

Smoke tests:

```powershell
gcloud run services describe opex-web --region=$REGION
gcloud run services describe opex-api --region=$REGION
gcloud run services describe opex-auth --region=$REGION
```

## Recovery Note

`deploy-auth.ps1` now supports `-DatabaseName`.

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
