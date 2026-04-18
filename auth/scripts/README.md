# Auth Scripts

Questa cartella e la source of truth per gli script PowerShell di `auth`.

## Struttura

- [build](C:/Users/danie/workspace/Opex/Opex-main/auth/scripts/build)
  build locale del tema Keycloakify e del provider Java
- [local](C:/Users/danie/workspace/Opex/Opex-main/auth/scripts/local)
  script admin per configurare il realm locale via Keycloak Admin API o `kcadm`
- [production](C:/Users/danie/workspace/Opex/Opex-main/auth/scripts/production)
  bootstrap post-deploy per applicare al realm production gli stessi setting del locale, con credenziali e valori diversi
- [lib](C:/Users/danie/workspace/Opex/Opex-main/auth/scripts/lib)
  funzioni PowerShell condivise per configurazione locale, Admin API Keycloak e comandi nel container

## Regola pratica

Se devi modificare o lanciare script, il posto giusto e sempre [auth/scripts](C:/Users/danie/workspace/Opex/Opex-main/auth/scripts).

Non esistono piu wrapper duplicati sotto `auth/keycloakify` o `auth/extensions/keycloak-onboarding-actions`.

## Script di build

- [build-local-theme.ps1](C:/Users/danie/workspace/Opex/Opex-main/auth/scripts/build/build-local-theme.ps1)
- [build-local-provider.ps1](C:/Users/danie/workspace/Opex/Opex-main/auth/scripts/build/build-local-provider.ps1)

Entrambi gli script buildano i jar senza toccare Keycloak, a meno che tu non passi esplicitamente `-RestartKeycloak`.

## Script locali

- [bootstrap-auth-local.ps1](C:/Users/danie/workspace/Opex/Opex-main/auth/scripts/local/bootstrap-auth-local.ps1)
  orchestration locale completa: build tema, build provider, singolo restart di Keycloak e apply dei setting locali del realm
- [apply-local-languages.ps1](C:/Users/danie/workspace/Opex/Opex-main/auth/scripts/local/apply-local-languages.ps1)
- [apply-local-login-settings.ps1](C:/Users/danie/workspace/Opex/Opex-main/auth/scripts/local/apply-local-login-settings.ps1)
- [apply-local-user-profile-settings.ps1](C:/Users/danie/workspace/Opex/Opex-main/auth/scripts/local/apply-local-user-profile-settings.ps1)
- [apply-local-smtp-settings.ps1](C:/Users/danie/workspace/Opex/Opex-main/auth/scripts/local/apply-local-smtp-settings.ps1)
- [apply-local-google-idp.ps1](C:/Users/danie/workspace/Opex/Opex-main/auth/scripts/local/apply-local-google-idp.ps1)
- [apply-local-security-setup-choice.ps1](C:/Users/danie/workspace/Opex/Opex-main/auth/scripts/local/apply-local-security-setup-choice.ps1)
- [apply-local-profile-basics.ps1](C:/Users/danie/workspace/Opex/Opex-main/auth/scripts/local/apply-local-profile-basics.ps1)
- [apply-local-country-selection.ps1](C:/Users/danie/workspace/Opex/Opex-main/auth/scripts/local/apply-local-country-selection.ps1)
- [apply-local-occupation.ps1](C:/Users/danie/workspace/Opex/Opex-main/auth/scripts/local/apply-local-occupation.ps1)
- [apply-local-legal-acceptance.ps1](C:/Users/danie/workspace/Opex/Opex-main/auth/scripts/local/apply-local-legal-acceptance.ps1)
- [apply-local-token-mappers.ps1](C:/Users/danie/workspace/Opex/Opex-main/auth/scripts/local/apply-local-token-mappers.ps1)

Nota importante:

- gli script `apply-local-*` non dipendono piu solo dal locale
- oggi sono script di apply realm riusabili anche per production, pur mantenendo il nome storico per compatibilita
- se non passi credenziali admin esplicite, fanno fallback alla `.env` locale

## Script produzione

- [bootstrap-auth-production.ps1](C:/Users/danie/workspace/Opex/Opex-main/auth/scripts/production/bootstrap-auth-production.ps1)
  applica al realm production gli stessi setting del bootstrap locale, ma via Admin API remota e con credenziali fornite esplicitamente

## Libreria condivisa

- [LocalConfig.ps1](C:/Users/danie/workspace/Opex/Opex-main/auth/scripts/lib/LocalConfig.ps1)
  lettura di `.env`, repo root e credenziali admin locali
- [KeycloakAdminApi.ps1](C:/Users/danie/workspace/Opex/Opex-main/auth/scripts/lib/KeycloakAdminApi.ps1)
  token admin e chiamate `GET/POST/PUT/DELETE` verso la Admin API
- [KeycloakRequiredActions.ps1](C:/Users/danie/workspace/Opex/Opex-main/auth/scripts/lib/KeycloakRequiredActions.ps1)
  helper riusabili per registrare, aggiornare o rimuovere required actions tramite Admin API
- [KeycloakContainer.ps1](C:/Users/danie/workspace/Opex/Opex-main/auth/scripts/lib/KeycloakContainer.ps1)
  helper per restart locale di Keycloak, health check e operazioni `docker compose`

## Bootstrap consigliato

Per il loop locale completo, il comando consigliato adesso e:

```powershell
.\auth\scripts\local\bootstrap-auth-local.ps1
```

Per includere anche SMTP reale e Google IDP:

```powershell
.\auth\scripts\local\bootstrap-auth-local.ps1 `
  -ApplySmtp `
  -SmtpHost "smtp.example.com" `
  -SmtpPort 587 `
  -Encryption StartTLS `
  -UseAuthentication $true `
  -Username "user@example.com" `
  -Password "<SMTP_PASSWORD>" `
  -FromAddress "user@example.com" `
  -FromDisplayName "Opex" `
  -ApplyGoogleIdp `
  -GoogleClientId "<GOOGLE_CLIENT_ID>" `
  -GoogleClientSecret "<GOOGLE_CLIENT_SECRET>"
```

## Bootstrap produzione

Per production il pattern consigliato e:

1. deploy del servizio `opex-auth`
2. apply dei setting realm via Admin API

Script base:

```powershell
.\auth\scripts\production\bootstrap-auth-production.ps1 `
  -KeycloakBaseUrl "https://auth.example.com" `
  -AdminUsername "<KC_ADMIN>" `
  -AdminPassword "<KC_ADMIN_PW>"
```

Il wrapper Cloud Run che legge i secret da Google Secret Manager sta qui:

- [apply-auth-production-settings.ps1](C:/Users/danie/workspace/Opex/Opex-main/deploy/cloud-run/apply-auth-production-settings.ps1)
