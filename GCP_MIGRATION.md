# Opex Google Cloud Migration

This document describes the final low-cost Google Cloud architecture recommended for the current Opex codebase.

## 1. Chosen Architecture

Use the simplest setup that keeps the platform easy to operate:

- `opex-web` on Cloud Run
- `opex-api` on Cloud Run
- `opex-auth` (Keycloak) on Cloud Run
- `opex-main-pg` on Cloud SQL for PostgreSQL
  - database `opexdb`
  - database `keycloak`
  - user `opex`
  - user `keycloak`
- one Docker repository in Artifact Registry
- Secret Manager for all sensitive values

## 2. Why This Is The Recommended Low-Cost Option

This is the best cost-first setup for the current project because:

- Cloud Run costs very little at low traffic when `min-instances=0`
- one Cloud SQL instance is much cheaper than running two separate database instances
- the current repository already has Dockerfiles for all three runtime services
- keeping frontend, backend, and Keycloak all containerized avoids introducing another hosting pattern right now
- the database remains managed, which is safer than trying to save money with self-managed PostgreSQL on a VM

## 3. What Not To Add Right Now

Do not add these components in phase 1:

- no GKE
- no Compute Engine VMs for the app
- no Redis
- no Pub/Sub
- no second Cloud SQL instance
- no Cloud SQL HA
- no separate static hosting stack for the frontend

They increase cost or complexity without solving a real immediate problem for the current traffic level.

## 4. Google Cloud Resources To Create

Create these resources only:

### Runtime

- Cloud Run service `opex-web`
- Cloud Run service `opex-api`
- Cloud Run service `opex-auth`

### Database

- Cloud SQL PostgreSQL instance `opex-main-pg`

Inside that instance create:

- database `opexdb`
- database `keycloak`
- user `opex`
- user `keycloak`

### Delivery And Secrets

- Artifact Registry repository `opex`
- Secret Manager secrets for app, auth, banking, and legal configuration

### Networking

- one VPC network
- one subnet in the same region as Cloud Run and Cloud SQL

Use this only so `opex-api` and `opex-auth` can reach the PostgreSQL instance over private IP with Direct VPC egress.

## 5. Final Service Placement

### `opex-web`

Deploy on Cloud Run.

Recommended settings:

- public service
- `min-instances=0`
- `max-instances` low at first
- no database connection
- no VPC egress needed

### `opex-api`

Deploy on Cloud Run.

Recommended settings:

- public service
- `min-instances=0`
- connect to Cloud SQL over private IP
- Direct VPC egress enabled
- secrets loaded from Secret Manager

### `opex-auth`

Deploy Keycloak on Cloud Run.

Recommended settings:

- public service
- `min-instances=0` at the beginning to save money
- connect to Cloud SQL over private IP
- Direct VPC egress enabled
- admin bootstrap credentials in Secret Manager

Note: if login cold starts become annoying, the first upgrade should be changing `opex-auth` to `min-instances=1`.

## 6. Final Database Decision

Use one single Cloud SQL PostgreSQL instance.

Recommended settings:

- PostgreSQL 16
- single-zone
- no HA
- automatic backups enabled
- point-in-time recovery only if the budget allows it
- small machine size at the beginning, then increase only if metrics show pressure

This database is the main cost center of the platform. The cheapest sensible choice is:

- one instance
- two databases
- no HA

## 7. Domains

Use three public domains:

- `app.example.com` -> `opex-web`
- `api.example.com` -> `opex-api`
- `auth.example.com` -> `opex-auth`

## 8. Existing Build Files In This Repository

The repository already includes container build files:

- `opex-web/Dockerfile`
- `opex-api/Dockerfile`
- `auth/Dockerfile`

These are the images to build and push to Artifact Registry.

## 9. Secrets To Create

At minimum create these secrets:

### App database

- `APP_PG_HOST`
- `APP_PG_PORT`
- `APP_PG_DB`
- `APP_PG_USER`
- `APP_PG_PASSWORD`

### Keycloak admin and realm

- `KEYCLOAK_SERVER_URL`
- `KEYCLOAK_ISSUER_URI`
- `KEYCLOAK_ADMIN_REALM`
- `KEYCLOAK_ADMIN_CLIENT_ID`
- `KEYCLOAK_TARGET_REALM`
- `KC_ADMIN`
- `KC_ADMIN_PW`

### Keycloak database

- `KEYCLOAK_DB_URL`
- `KEYCLOAK_DB_USERNAME`
- `KEYCLOAK_DB_PASSWORD`

### Salt Edge

- `SALTEDGE_APP_ID`
- `SALTEDGE_SECRET`
- `SALTEDGE_RETURN_TO_URL`

### Legal configuration

- legal controller values
- legal policy versions
- retention strings if you want non-default values

## 10. Recommended Deployment Order

Follow this order:

1. Create the Google Cloud project.
2. Enable required APIs.
3. Create Artifact Registry.
4. Create the VPC and subnet.
5. Create the Cloud SQL instance.
6. Create the two databases and two users.
7. Export local data and import it into Cloud SQL.
8. Create all required secrets in Secret Manager.
9. Build and push `opex-auth`.
10. Deploy `opex-auth`.
11. Validate Keycloak realm and login endpoints.
12. Build and push `opex-api`.
13. Deploy `opex-api`.
14. Validate `GET /api/legal/public`.
15. Build and push `opex-web`.
16. Deploy `opex-web`.
17. Update Keycloak redirect URIs and web origins.
18. Run end-to-end smoke tests.

## 11. Keycloak Client Update

After deployment, update the Keycloak client `opex` with:

### Valid redirect URIs

- `https://app.example.com`
- `https://app.example.com/*`

### Web origins

- `https://app.example.com`

## 12. Smoke Test Checklist

Check these URLs:

- frontend root
- `GET /api/legal/public`
- Keycloak well-known realm configuration
- login flow
- Salt Edge connect flow

Check these integrations:

- app database connectivity
- Keycloak database connectivity
- frontend to backend calls
- frontend to Keycloak redirects

## 13. Final Recommendation Summary

If cost is the main constraint, the final recommendation is:

- keep all three runtime services on Cloud Run
- keep `min-instances=0` on all of them initially
- use one single Cloud SQL PostgreSQL instance
- create two databases inside that single instance
- do not add HA yet
- do not introduce more infrastructure until real traffic justifies it

## 14. First Future Upgrades

When the project grows, upgrade in this order:

1. Set `opex-auth` to `min-instances=1`
2. Increase Cloud SQL machine size if needed
3. Enable Cloud SQL HA only when downtime becomes unacceptable
4. Add CI/CD for image build and deploy
5. Add monitoring, alerts, and uptime checks
