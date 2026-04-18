# Opex

Repository root for the Opex local stack.

## Modules

- `opex-api`: Spring Boot API
- `opex-web`: React and Vite frontend
- `auth`: Keycloak realm import and theme assets

## Local Run

1. Build or refresh the local Keycloak theme:

```powershell
cd .\auth\keycloakify
.\build-local-theme.ps1
cd ..\..
```

2. Start infrastructure from the repository root:

```powershell
docker compose up -d
```

3. Start the API:

```powershell
cd .\opex-api
.\mvnw.cmd spring-boot:run
```

4. Start the frontend:

```powershell
cd ..\opex-web
npm.cmd run dev -- --host 0.0.0.0
```

For theme-specific local development, see [auth/keycloakify/README.md](C:/Users/danie/workspace/Opex/Opex-main/auth/keycloakify/README.md).

## Google Cloud

For the production deployment guide and ready-to-run Cloud Run scripts, see [deploy/cloud-run/README.md](C:/Users/danie/workspace/Opex/Opex-main/deploy/cloud-run/README.md).
