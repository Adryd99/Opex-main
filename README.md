# Opex

Repository root for the Opex application stack.

## Repository Map

- [auth](C:/Users/danie/workspace/Opex/Opex-main/auth)
  Keycloak realm, login theme, onboarding extensions, and auth bootstrap scripts.
- [opex-api](C:/Users/danie/workspace/Opex/Opex-main/opex-api)
  Spring Boot backend API.
- [opex-web](C:/Users/danie/workspace/Opex/Opex-main/opex-web)
  React and Vite frontend.
- [deploy/cloud-run](C:/Users/danie/workspace/Opex/Opex-main/deploy/cloud-run)
  Production build and deploy scripts for Cloud Run.
- [logo](C:/Users/danie/workspace/Opex/Opex-main/logo)
  Shared brand assets kept at repository level.

## Root Files

- [docker-compose.yml](C:/Users/danie/workspace/Opex/Opex-main/docker-compose.yml)
  Local infrastructure for Keycloak and PostgreSQL.
- [.env.example](C:/Users/danie/workspace/Opex/Opex-main/.env.example)
  Template for root local infrastructure settings.

## Local Bootstrap

1. Prepare the root local env file:

```powershell
Copy-Item .\.env.example .\.env
```

2. Start local infrastructure:

```powershell
docker compose up -d
```

3. Bootstrap Keycloak auth:

```powershell
.\auth\scripts\local\bootstrap-auth-local.ps1
```

4. Start the backend API:

```powershell
cd .\opex-api
.\mvnw.cmd spring-boot:run
```

5. Start the frontend:

```powershell
cd ..\opex-web
Copy-Item .\.env.example .\.env
npm.cmd run dev -- --host 0.0.0.0
```

Local URLs:

- app: [http://localhost:3000](http://localhost:3000)
- api: [http://localhost:8080](http://localhost:8080)
- auth: [http://localhost:8081](http://localhost:8081)

## Module Guides

- [auth/README.md](C:/Users/danie/workspace/Opex/Opex-main/auth/README.md)
- [opex-api/README.md](C:/Users/danie/workspace/Opex/Opex-main/opex-api/README.md)
- [opex-web/README.md](C:/Users/danie/workspace/Opex/Opex-main/opex-web/README.md)

## Production Deploy

For Cloud Run build and deploy flow, environment files, and secret handling, see:

- [deploy/cloud-run/README.md](C:/Users/danie/workspace/Opex/Opex-main/deploy/cloud-run/README.md)

Cloud Build definitions now live under:

- [deploy/cloud-run/build](C:/Users/danie/workspace/Opex/Opex-main/deploy/cloud-run/build)

The Cloud Run README is the authoritative production runbook and now reflects the current clean deployment on:

- project `opex-v2-493902`
- region `europe-west1`
- domains `opes.dani.host`, `api.opes.dani.host`, `auth.opes.dani.host`

Before any real production deploy, run the deployment preflight:

```powershell
.\deploy\cloud-run\preflight-stack.ps1
```
