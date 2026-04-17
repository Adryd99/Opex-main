# Opex

Repository root for the Opex local stack.

## Modules

- `opex-api`: Spring Boot API
- `opex-web`: React and Vite frontend
- `auth`: Keycloak realm import and theme assets

## Local Run

1. Start infrastructure from the repository root:

```powershell
docker compose up -d
```

2. Start the API:

```powershell
cd .\opex-api
.\mvnw.cmd spring-boot:run
```

3. Start the frontend:

```powershell
cd ..\opex-web
npm.cmd run dev -- --host 0.0.0.0
```

## Google Cloud

For the production migration plan and container strategy, see [GCP_MIGRATION.md](C:/Users/danie/workspace/Opex/Opex-main/GCP_MIGRATION.md).
