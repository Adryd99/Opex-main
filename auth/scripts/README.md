# Auth Scripts

Questa cartella e la source of truth operativa del layer `auth`.

Qui vive tutto cio che builda, riallinea o applica davvero la configurazione runtime del realm:

- build del tema Keycloakify
- build del provider Java
- bootstrap locale completo
- apply di realm settings via Admin API
- bootstrap production post-deploy

Se devi cambiare il comportamento operativo di Keycloak, il punto di ingresso giusto e qui.

## Struttura

- [build](./build)
  Script di build per tema e provider.
- [local](./local)
  Script di apply e bootstrap del realm locale.
- [production](./production)
  Bootstrap post-deploy per applicare gli stessi setting del locale contro un realm remoto.
- [lib](./lib)
  Helper PowerShell condivisi per `.env`, Admin API, required actions, authentication flows e container locale.

## Entry point consigliati

### Build solo tema

```powershell
.\auth\scripts\build\build-local-theme.ps1
```

Usalo quando hai cambiato solo `auth/keycloakify`.

### Build solo provider Java

```powershell
.\auth\scripts\build\build-local-provider.ps1
```

Usalo quando hai cambiato solo `auth/extensions/keycloak-onboarding-actions`.

### Bootstrap locale completo

```powershell
.\auth\scripts\local\bootstrap-auth-local.ps1
```

Usalo quando vuoi riallineare tutto il layer auth locale dopo modifiche a tema, provider o realm settings.

### Bootstrap production

```powershell
.\auth\scripts\production\bootstrap-auth-production.ps1 `
  -KeycloakBaseUrl "https://auth.example.com" `
  -AdminUsername "<KC_ADMIN>" `
  -AdminPassword "<KC_ADMIN_PW>"
```

Usalo dopo il deploy del servizio Keycloak per applicare i setting runtime del realm.

## Bootstrap locale: cosa fa davvero

`bootstrap-auth-local.ps1` orchestra tutto il loop auth locale:

1. build tema, a meno che non passi `-SkipThemeBuild`
2. build provider Java, a meno che non passi `-SkipProviderBuild`
3. riavvia Keycloak una sola volta se almeno uno dei due jar e cambiato
4. aspetta che il container sia `healthy`
5. applica il realm via Admin API, a meno che non passi `-SkipRealmSetup`

Ordine attuale di apply:

1. `apply-local-languages.ps1`
2. `apply-local-login-settings.ps1`
3. `apply-local-browser-2fa-flow.ps1`
4. `apply-local-password-update.ps1`
5. `apply-local-user-profile-settings.ps1`
6. `apply-local-security-setup-choice.ps1`
7. `apply-local-profile-basics.ps1`
8. `apply-local-country-selection.ps1`
9. `apply-local-occupation.ps1`
10. `apply-local-legal-acceptance.ps1`
11. `apply-local-token-mappers.ps1`
12. `apply-local-smtp-settings.ps1` se richiesto o configurato
13. `apply-local-google-idp.ps1` se richiesto o configurato

## Script di build

- [build/build-local-theme.ps1](./build/build-local-theme.ps1)
- [build/build-local-provider.ps1](./build/build-local-provider.ps1)

Comportamento:

- buildano i jar in `auth/themes`
- non toccano Keycloak a meno che tu non passi `-RestartKeycloak`
- usano strumenti locali se disponibili
- fanno fallback agli strumenti scaricati localmente quando serve

## Script locali principali

### Realm base

- [local/apply-local-languages.ps1](./local/apply-local-languages.ps1)
  Abilita internazionalizzazione, supporta `it` e `en`, imposta `it` come default.
- [local/apply-local-login-settings.ps1](./local/apply-local-login-settings.ps1)
  Imposta `resetPasswordAllowed` e la password policy del realm.
- [local/apply-local-user-profile-settings.ps1](./local/apply-local-user-profile-settings.ps1)
  Abilita `unmanagedAttributePolicy = ENABLED`, necessario per gli attributi custom usati dal flow.
- [local/apply-local-token-mappers.ps1](./local/apply-local-token-mappers.ps1)
  Crea/aggiorna la client scope `opex-onboarding` e pubblica:
  - `birthDate`
  - `country`
  - `occupation`
  - `profilePicture`
  - `identityProvider`
  - `legalAccepted`

### Required actions e onboarding

- [local/apply-local-password-update.ps1](./local/apply-local-password-update.ps1)
  Registra e configura `OPEX_UPDATE_PASSWORD`.
- [local/apply-local-security-setup-choice.ps1](./local/apply-local-security-setup-choice.ps1)
  Registra e ordina:
  - `SECURITY_SETUP_CHOICE`
  - `OPTIONAL_CONFIGURE_TOTP`
  - `OPTIONAL_WEBAUTHN_REGISTER`
  - `CONFIGURE_TOTP`
  - `webauthn-register`
  - `CONFIGURE_RECOVERY_AUTHN_CODES`
  - `VERIFY_EMAIL`
- [local/apply-local-profile-basics.ps1](./local/apply-local-profile-basics.ps1)
  Abilita `PROFILE_BASICS` e disattiva `UPDATE_PROFILE` come step di default.
- [local/apply-local-country-selection.ps1](./local/apply-local-country-selection.ps1)
  Registra `COUNTRY_SELECTION`.
- [local/apply-local-occupation.ps1](./local/apply-local-occupation.ps1)
  Registra `OCCUPATION`.
- [local/apply-local-legal-acceptance.ps1](./local/apply-local-legal-acceptance.ps1)
  Registra `LEGAL_ACCEPTANCE`, disabilita `TERMS_AND_CONDITIONS` e mantiene `VERIFY_EMAIL` fuori dal blocco onboarding.

### Authentication flows

- [local/apply-local-browser-2fa-flow.ps1](./local/apply-local-browser-2fa-flow.ps1)
  Riallinea sia `Browser - Conditional 2FA` sia `First broker login - Conditional 2FA`.

Stato attuale dei flow 2FA:

- `conditional-user-configured` = `REQUIRED`
- `conditional-credential` = `REQUIRED`
- `auth-otp-form` = `ALTERNATIVE`
- `webauthn-authenticator` = `ALTERNATIVE`
- `auth-recovery-authn-code-form` = `ALTERNATIVE`

In piu:

- `CONFIGURE_TOTP`, `webauthn-register` e `CONFIGURE_RECOVERY_AUTHN_CODES` vengono configurate con `max_auth_age = 900`
- questo permette alle AIA lanciate da `Settings > Security` di riusare una sessione Keycloak recente invece di richiedere sempre re-login

### Integrazioni esterne

- [local/apply-local-smtp-settings.ps1](./local/apply-local-smtp-settings.ps1)
  Scrive `smtpServer` nel realm.
- [local/apply-local-google-idp.ps1](./local/apply-local-google-idp.ps1)
  Crea o aggiorna il provider Google e i flow collegati.

Dettagli importanti dello script Google:

- first broker login flow dedicato: `opex-google-first-broker-login`
- post-broker login flow dedicato: `opex-google-post-login-conditional-2fa`
- mapper Google:
  - first name
  - last name
  - profile picture

## Fallback `.env`

Gli script locali fanno fallback al file root `.env`.

Variabili richieste per le credenziali admin locali:

- `KC_ADMIN`
- `KC_ADMIN_PW`

Variabili opzionali lette da `bootstrap-auth-local.ps1`:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_ENCRYPTION`
- `SMTP_USE_AUTHENTICATION`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `SMTP_FROM_ADDRESS`
- `SMTP_FROM_DISPLAY_NAME`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Se sono presenti, il bootstrap locale puo applicare SMTP e Google IDP senza passare tutti i parametri a mano.

## Production

`bootstrap-auth-production.ps1` non builda jar e non tocca Docker.

Fa una sola cosa:

- applica al realm remoto gli stessi setting runtime usati in locale, via Admin API

Questa scelta e intenzionale:

- il container Keycloak si occupa del runtime
- gli script production si occupano dello stato del realm nel DB Keycloak

Per Cloud Run esiste anche il wrapper:

- [../deploy/cloud-run/apply-auth-production-settings.ps1](../deploy/cloud-run/apply-auth-production-settings.ps1)

## Libreria condivisa

- [lib/LocalConfig.ps1](./lib/LocalConfig.ps1)
  Risolve repo root, `.env` e credenziali admin locali.
- [lib/KeycloakAdminApi.ps1](./lib/KeycloakAdminApi.ps1)
  Token admin e chiamate `GET/POST/PUT/DELETE`.
- [lib/KeycloakRequiredActions.ps1](./lib/KeycloakRequiredActions.ps1)
  Helper per registrare, aggiornare o rimuovere required actions.
- [lib/KeycloakAuthenticationFlows.ps1](./lib/KeycloakAuthenticationFlows.ps1)
  Helper per leggere e modificare requirement ed execution dei flow.
- [lib/KeycloakContainer.ps1](./lib/KeycloakContainer.ps1)
  Restart locale, health check e operazioni `docker compose`.

## Regola pratica

Se devi:

- buildare il tema o il provider: usa `build/`
- riallineare il realm locale: usa `local/`
- applicare setting a production: usa `production/`
- aggiungere helper riusabili: usa `lib/`

Non creare wrapper duplicati altrove dentro `auth`.
