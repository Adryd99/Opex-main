# Auth Workspace

Questa cartella contiene tutto il layer Keycloak di Opex:

- configurazione dichiarativa del realm
- tema custom Keycloakify per login e onboarding
- estensioni Java server-side per i required actions custom
- script di build e bootstrap locale / production

L'obiettivo di questo README e descrivere il flow reale che gira oggi, non solo la struttura della cartella.

## Mappa rapida

- [realm](./realm)
  Base dichiarativa del realm e configurazioni importabili.
- [keycloakify](./keycloakify)
  Tema React/TypeScript del login, onboarding e second-factor UI.
- [extensions/keycloak-onboarding-actions](./extensions/keycloak-onboarding-actions)
  Modulo Java con required actions custom e support server-side.
- [scripts](./scripts)
  Source of truth operativa per build, bootstrap e apply via Admin API.
- [themes](./themes)
  Jar runtime buildati localmente e montati dal Keycloak locale.
- [Dockerfile](./Dockerfile)
  Build image che compila tema e provider direttamente dai sorgenti.

## Separazione delle responsabilita

### Tema Keycloakify

Il tema decide:

- layout, branding e CSS
- copy e i18n
- quali pagine `.ftl` custom hanno una UI React dedicata
- come si presentano progress, errori, modal e auth pages

Il tema non decide:

- quando uno step si attiva
- quando uno step si salta
- come vengono salvati gli attributi utente
- come vengono configurati flow, SMTP, Google IDP o token mappers

README dedicato:
- [auth/keycloakify/README.md](./keycloakify/README.md)

### Estensioni Java

Le estensioni decidono:

- quando un required action custom deve mostrarsi
- come funziona la navigazione `Back` / `Skip`
- come vengono salvati attributi custom su Keycloak
- come vengono orchestrati i rami `email+password`, Google, TOTP e WebAuthn
- come viene eseguito il cambio password custom lanciato dall'app

Le estensioni non decidono branding o configurazione realm.

README dedicato:
- [auth/extensions/keycloak-onboarding-actions/README.md](./extensions/keycloak-onboarding-actions/README.md)

### Realm

I file sotto [realm/local](./realm/local) e [realm/production](./realm/production) descrivono la base del realm:

- realm metadata
- client base
- configurazioni importabili

Non rappresentano da soli tutto lo stato runtime del realm. Alcune parti vengono applicate via script:

- lingue supportate
- login settings e password policy
- SMTP
- Google Identity Provider
- token mappers
- required actions, priorita e stato di default
- browser flow 2FA

### Script

Gli script sotto [scripts](./scripts) sono la source of truth operativa:

- build del tema e del provider Java
- bootstrap locale completo
- apply via Admin API per locale e production
- riallineamento dei flow di autenticazione

README dedicato:
- [auth/scripts/README.md](./scripts/README.md)

## Flow attuale

### 1. Nuovo utente `email + password`

Flow runtime attuale:

1. login / register standard Keycloak
2. `SECURITY_SETUP_CHOICE`
3. se l'utente sceglie `totp`, viene eseguito `OPTIONAL_CONFIGURE_TOTP`
4. se l'utente sceglie `webauthn`, viene eseguito `OPTIONAL_WEBAUTHN_REGISTER`
5. dopo un setup TOTP o WebAuthn riuscito, l'estensione aggiunge `CONFIGURE_RECOVERY_AUTHN_CODES` se i recovery codes non esistono ancora
6. `PROFILE_BASICS`
7. `COUNTRY_SELECTION`
8. `OCCUPATION`
9. `LEGAL_ACCEPTANCE`

Note importanti:

- scegliere `later` nello step sicurezza rimuove i setup TOTP/WebAuthn dal blocco onboarding e prosegue verso `PROFILE_BASICS`
- `VERIFY_EMAIL` non fa parte di questo onboarding custom; viene lanciato dall'app/backend quando serve
- il browser flow principale espone OTP, WebAuthn e recovery codes come alternative reali al login

### 2. Nuovo utente Google

Flow runtime attuale:

1. login brokerizzato via Google
2. first broker login flow dedicato per linkare l'account esistente tramite password se necessario
3. `SECURITY_SETUP_CHOICE` viene saltato server-side
4. `PROFILE_BASICS` chiede solo i campi davvero mancanti
5. `COUNTRY_SELECTION`
6. `OCCUPATION`
7. `LEGAL_ACCEPTANCE`

Note importanti:

- `firstName` e `lastName` vengono normalmente presi da Google tramite mapper
- `birthDate` resta raccolto da Opex se manca
- dopo il ritorno dal broker, il post-login flow dedicato richiede il secondo fattore solo se l'utente ha gia un metodo configurato

### 3. Utente gia configurato

Per gli utenti gia onboardati:

- il browser flow usa un subflow 2FA condizionale
- se l'utente ha credenziali configurate, Keycloak propone OTP, WebAuthn o recovery code come alternative
- se l'utente non ha alcun secondo fattore configurato, il login prosegue senza mostrare step 2FA

### 4. Azioni lanciate dall'app Opex

Da `Settings > Security`, Opex lancia required actions standard o custom via AIA:

- `OPEX_UPDATE_PASSWORD`
- `CONFIGURE_TOTP`
- `webauthn-register`
- `CONFIGURE_RECOVERY_AUTHN_CODES`

Comportamento attuale:

- il tema nasconde progress bar e step onboarding quando la pagina arriva da un'app-initiated action
- `CONFIGURE_TOTP`, `webauthn-register` e `CONFIGURE_RECOVERY_AUTHN_CODES` sono configurate con `max_auth_age = 900`
- `OPEX_UPDATE_PASSWORD` usa invece una pagina custom che chiede la password attuale e valida il cambio lato server

### 5. Verify email

La verify email non e un required action custom di questo onboarding.

Il flow attuale e:

1. il frontend chiama il backend Opex
2. il backend invoca `sendVerifyEmail(...)` su Keycloak
3. Keycloak usa lo SMTP configurato sul realm
4. il link porta alla UI Keycloak standard/customizzata dal tema

Per utenti Google, `emailVerified` resta normalmente gia coerente col broker.

## Source of truth

Usa questa regola pratica:

- UI, pagine, CSS, copy, i18n:
  [auth/keycloakify/src](./keycloakify/src)
- logica server-side del flow:
  [auth/extensions/keycloak-onboarding-actions/src](./extensions/keycloak-onboarding-actions/src)
- configurazione dichiarativa del realm:
  [auth/realm](./realm)
- build, bootstrap e apply via Admin API:
  [auth/scripts](./scripts)
- artefatti runtime locali:
  [auth/themes](./themes)

In breve:

- `src` e `realm` sono sorgente
- `scripts` applica e orchestra
- `themes` contiene solo output runtime buildato

## Loop locale consigliato

Dal root del repository:

1. avvia l'infrastruttura locale

```powershell
docker compose up -d
```

2. esegui il bootstrap auth completo

```powershell
.\auth\scripts\local\bootstrap-auth-local.ps1
```

Lo script:

- builda tema e provider
- riavvia Keycloak una sola volta se i jar cambiano
- aspetta che Keycloak sia `healthy`
- applica il realm locale via Admin API in un ordine preciso

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
12. SMTP opzionale
13. Google IDP opzionale

Di default il bootstrap locale abilita anche:

- lingue supportate `it`, `en`
- lingua di default `it`
- `resetPasswordAllowed = true`
- password policy:
  `length(10) and lowerCase(1) and upperCase(1) and digits(1) and specialChars(1) and notUsername(undefined) and passwordHistory(3)`
- `unmanagedAttributePolicy = ENABLED`

## Modello production

Per production il modello raccomandato e:

1. deploy del container Keycloak
2. apply post-deploy delle impostazioni di realm via Admin API

Questo e necessario perche molte parti non sono semplici env vars del container:

- SMTP
- Google IDP
- flow browser / post-broker
- token mappers
- required actions
- lingue e user profile settings

Entry point:

- [auth/scripts/production/bootstrap-auth-production.ps1](./scripts/production/bootstrap-auth-production.ps1)
- wrapper Cloud Run:
  [deploy/cloud-run/apply-auth-production-settings.ps1](../deploy/cloud-run/apply-auth-production-settings.ps1)

## Runtime locale e packaging

Il Keycloak locale consuma questi jar:

- [auth/themes/keycloak-theme-opex.jar](./themes/keycloak-theme-opex.jar)
- [auth/themes/keycloak-onboarding-actions.jar](./themes/keycloak-onboarding-actions.jar)

Questo significa:

- se modifichi il tema, devi rebuildare il jar del tema
- se modifichi le estensioni Java, devi rebuildare il jar del provider
- il riavvio di Keycloak ricarica i jar aggiornati

Il [Dockerfile](./Dockerfile) non dipende dai jar gia presenti in `auth/themes`: builda tema e provider direttamente dai sorgenti e li copia dentro `/opt/keycloak/providers`.

## Sorgente vs artefatti generati

### Sorgente vero

- [auth/realm](./realm)
- [auth/keycloakify/src](./keycloakify/src)
- [auth/extensions/keycloak-onboarding-actions/src](./extensions/keycloak-onboarding-actions/src)
- [auth/scripts](./scripts)
- file di configurazione (`pom.xml`, `package.json`, `tsconfig`, ecc.)

### Artefatti generati

- [auth/themes](./themes)
- `auth/keycloakify/dist`
- `auth/keycloakify/dist_keycloak`
- `auth/keycloakify/node_modules`
- `auth/keycloakify/.tools`
- `auth/extensions/keycloak-onboarding-actions/target`

Questi artefatti possono essere rigenerati.

## Da dove partire

- vuoi cambiare UI o copy del flow:
  [auth/keycloakify/README.md](./keycloakify/README.md)
- vuoi cambiare logica server-side di onboarding o password update:
  [auth/extensions/keycloak-onboarding-actions/README.md](./extensions/keycloak-onboarding-actions/README.md)
- vuoi cambiare bootstrap, Google IDP, SMTP o flow realm:
  [auth/scripts/README.md](./scripts/README.md)
