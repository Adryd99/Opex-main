# Auth Workspace

Questa cartella contiene tutto il layer di autenticazione e identita di Opex basato su Keycloak.

## Obiettivo

Dentro `auth` convivono quattro responsabilita diverse:

- configurazione del realm Keycloak
- tema UI custom del login/onboarding
- estensioni Java server-side per i required actions custom
- script locali di build e bootstrap

La cosa importante e non confondere i livelli:

- il **tema** decide come si presenta il flow
- le **estensioni Java** decidono come si comporta il flow server-side
- il **realm** decide quali provider, setting e required actions sono registrati
- gli **script** applicano in locale build e configurazioni operative

## Mappa della cartella

- [realm](C:/Users/danie/workspace/Opex/Opex-main/auth/realm)
  Base dichiarativa del realm.
- [keycloakify](C:/Users/danie/workspace/Opex/Opex-main/auth/keycloakify)
  Sorgenti React/TypeScript del tema Keycloak custom.
- [extensions/keycloak-onboarding-actions](C:/Users/danie/workspace/Opex/Opex-main/auth/extensions/keycloak-onboarding-actions)
  Modulo Java con required actions e support classes custom.
- [scripts](C:/Users/danie/workspace/Opex/Opex-main/auth/scripts)
  Source of truth per build e configurazione operativa del realm in locale e production.
- [themes](C:/Users/danie/workspace/Opex/Opex-main/auth/themes)
  Jar finali consumati dal runtime Keycloak locale.
- [Dockerfile](C:/Users/danie/workspace/Opex/Opex-main/auth/Dockerfile)
  Build image di Keycloak per ambienti non `docker compose`.

## Responsabilita per area

### Realm settings

I file sotto [realm/local](C:/Users/danie/workspace/Opex/Opex-main/auth/realm/local) e [realm/production](C:/Users/danie/workspace/Opex/Opex-main/auth/realm/production) descrivono la base del realm:

- realm metadata
- client base
- login settings di base
- configurazioni importabili in locale o usabili come riferimento per deploy

Questi file **non** coprono sempre tutto quello che iteriamo velocemente in locale tramite Admin API. Per esempio:

- lingue
- user profile settings
- SMTP
- Google IDP
- token mappers
- priorita e stato delle required actions custom
- browser 2FA flow e metodi alternativi di login

In locale queste parti vengono applicate dagli script sotto [auth/scripts/local](C:/Users/danie/workspace/Opex/Opex-main/auth/scripts/local).

In production lo stesso modello adesso e disponibile tramite:

- [auth/scripts/production](C:/Users/danie/workspace/Opex/Opex-main/auth/scripts/production)
- [deploy/cloud-run/apply-auth-production-settings.ps1](C:/Users/danie/workspace/Opex/Opex-main/deploy/cloud-run/apply-auth-production-settings.ps1)

### Tema Keycloakify

Il tema in [keycloakify](C:/Users/danie/workspace/Opex/Opex-main/auth/keycloakify) gestisce solo il lato presentazionale:

- branding
- layout
- copy e i18n
- pagine custom del flow
- componenti React e CSS

Tra le pagine custom gestite dal tema rientra anche `login-update-password.ftl`, usata dal cambio password reale lanciato dall'app via Keycloak AIA.

Quando il cambio password parte da `Settings > Security`, Opex usa la required action custom `OPEX_UPDATE_PASSWORD`, che mostra:

- password attuale
- nuova password
- conferma nuova password

riusando gli stessi controlli password custom del tema.

Il tema **non** deve contenere logica server-side del flow.

README dedicato:
- [auth/keycloakify/README.md](C:/Users/danie/workspace/Opex/Opex-main/auth/keycloakify/README.md)

### Estensioni Java

Le estensioni in [extensions/keycloak-onboarding-actions](C:/Users/danie/workspace/Opex/Opex-main/auth/extensions/keycloak-onboarding-actions) gestiscono:

- required actions custom
- navigazione server-side `Back` / `Skip`
- supporto ai rami Google / TOTP / WebAuthn
- salvataggio attributi custom sullo user Keycloak

Le estensioni **non** devono contenere branding o layout del tema.

README dedicato:
- [auth/extensions/keycloak-onboarding-actions/README.md](C:/Users/danie/workspace/Opex/Opex-main/auth/extensions/keycloak-onboarding-actions/README.md)

### Script locali

 Gli script in [auth/scripts](C:/Users/danie/workspace/Opex/Opex-main/auth/scripts) sono la source of truth operativa per:

- build del tema
- build del provider Java
- bootstrap locale completo
- patch del realm locale via Admin API o `kcadm`

README dedicato:
- [auth/scripts/README.md](C:/Users/danie/workspace/Opex/Opex-main/auth/scripts/README.md)

## Source of truth

Questa e la regola pratica da seguire:

- **UI / pagine / CSS / traduzioni**
  Source of truth: [auth/keycloakify/src](C:/Users/danie/workspace/Opex/Opex-main/auth/keycloakify/src)
- **Required actions e helper server-side**
  Source of truth: [auth/extensions/keycloak-onboarding-actions/src](C:/Users/danie/workspace/Opex/Opex-main/auth/extensions/keycloak-onboarding-actions/src)
- **Configurazione realm dichiarativa di base**
  Source of truth: [auth/realm](C:/Users/danie/workspace/Opex/Opex-main/auth/realm)
- **Bootstrap e apply locali**
  Source of truth: [auth/scripts](C:/Users/danie/workspace/Opex/Opex-main/auth/scripts)
- **Jar runtime usati da Keycloak**
  Source of truth runtime locale: [auth/themes](C:/Users/danie/workspace/Opex/Opex-main/auth/themes)

In altre parole:

- `src` e `realm` sono sorgente
- `scripts` applica e orchestra
- `themes` contiene l'output finale da montare/eseguire

## Bootstrap locale

Workflow consigliato dal root del repository:

1. avvia l'infrastruttura locale
```powershell
docker compose up -d
```

2. esegui il bootstrap auth
```powershell
.\auth\scripts\local\bootstrap-auth-local.ps1
```

Questo comando:

- builda il tema
- builda il provider Java
- ricarica Keycloak una volta sola
- aspetta che Keycloak sia `healthy`
- applica i setting locali del realm
- applica anche la password policy base del realm:
  `length(10) and lowerCase(1) and upperCase(1) and digits(1) and specialChars(1) and notUsername(undefined) and passwordHistory(3)`
- riallinea il browser flow 2FA con `OTP Form`, `WebAuthn Authenticator` e `Recovery Authentication Code Form` come alternative
- mantiene `CONFIGURE_RECOVERY_AUTHN_CODES` subito dopo il setup TOTP/WebAuthn nel blocco onboarding
- applica il flow onboarding locale
- applica i token mappers

SMTP e Google IDP restano opzionali e si attivano passando i parametri richiesti oppure salvando i rispettivi valori `SMTP_*` e `GOOGLE_*` nel file root `.env` locale.

## 2FA State

Lo stato attuale del sistema 2FA e questo:

- il browser flow principale usa `OTP Form`, `WebAuthn Authenticator` e `Recovery Authentication Code Form` come alternative nello stesso blocco 2FA
- anche il subflow `First broker login - Conditional 2FA` usa gli stessi tre metodi come alternative, quindi il ramo broker/social login e allineato al browser flow principale
- il provider Google locale usa anche un `Post login flow` dedicato (`opex-google-post-login-2fa`) che riapplica lo stesso blocco 2FA dopo il ritorno dall'identity provider
- l'onboarding puo portare a:
  - setup TOTP
  - setup WebAuthn
  - setup recovery codes subito dopo il completamento del secondo fattore principale
- il backend espone uno stato dedicato per il frontend tramite `GET /api/users/security`
- il frontend usa direttamente `Settings > Security` per leggere dati reali e lanciare i flow Keycloak via AIA
- le AIA usate da `Settings > Security` per `CONFIGURE_TOTP`, `webauthn-register` e `CONFIGURE_RECOVERY_AUTHN_CODES` riusano una finestra di autenticazione recente di `900` secondi prima di richiedere una nuova login Keycloak
- il metodo 2FA mostrato al frontend viene derivato dalle credenziali reali Keycloak, non solo dagli attributi custom scritti in onboarding

## Bootstrap produzione

Il deploy production di `auth` adesso e pensato in due fasi:

1. deploy del container Keycloak su Cloud Run
2. apply post-deploy dei setting di realm via Admin API

Questo e importante perche alcune impostazioni production non sono semplici env del container, ma dati del realm salvati nel DB Keycloak:

- SMTP del realm
- Google Identity Provider
- token mappers
- required actions e ordine del flow
- lingue e user profile settings

Per questo motivo la strategia consigliata e:

- **env vars / Secret Manager** per salvare i valori production
- **script di apply realm** per scriverli davvero nel realm

Wrapper Cloud Run:

- [deploy/cloud-run/apply-auth-production-settings.ps1](C:/Users/danie/workspace/Opex/Opex-main/deploy/cloud-run/apply-auth-production-settings.ps1)

## Runtime locale

Nel loop locale il container Keycloak legge i jar da:

- [auth/themes/keycloak-theme-opex.jar](C:/Users/danie/workspace/Opex/Opex-main/auth/themes/keycloak-theme-opex.jar)
- [auth/themes/keycloak-onboarding-actions.jar](C:/Users/danie/workspace/Opex/Opex-main/auth/themes/keycloak-onboarding-actions.jar)

Questo significa che:

- buildare il tema aggiorna il jar del tema in `auth/themes`
- buildare il provider aggiorna il jar Java in `auth/themes`
- riavviare Keycloak ricarica quei jar

## Packaging

Il [Dockerfile](C:/Users/danie/workspace/Opex/Opex-main/auth/Dockerfile) builda tema e provider direttamente dai sorgenti:

- [auth/keycloakify](C:/Users/danie/workspace/Opex/Opex-main/auth/keycloakify)
- [auth/extensions/keycloak-onboarding-actions](C:/Users/danie/workspace/Opex/Opex-main/auth/extensions/keycloak-onboarding-actions)

e poi copia i jar prodotti dentro `/opt/keycloak/providers`.

Quindi l'immagine finale include:

- tema custom
- estensioni Java custom

senza dipendere dai jar gia presenti in [auth/themes](C:/Users/danie/workspace/Opex/Opex-main/auth/themes).

## Sorgente vs artefatti generati

### Sorgente vero

- [auth/realm](C:/Users/danie/workspace/Opex/Opex-main/auth/realm)
- [auth/keycloakify/src](C:/Users/danie/workspace/Opex/Opex-main/auth/keycloakify/src)
- [auth/extensions/keycloak-onboarding-actions/src](C:/Users/danie/workspace/Opex/Opex-main/auth/extensions/keycloak-onboarding-actions/src)
- [auth/scripts](C:/Users/danie/workspace/Opex/Opex-main/auth/scripts)
- README e file di configurazione (`pom.xml`, `package.json`, `tsconfig`, ecc.)

### Artefatti generati

- [auth/themes](C:/Users/danie/workspace/Opex/Opex-main/auth/themes)
  Artefatti runtime buildati localmente.
- `auth/keycloakify/dist`
- `auth/keycloakify/dist_keycloak`
- `auth/keycloakify/node_modules`
- `auth/keycloakify/.tools`
- `auth/extensions/keycloak-onboarding-actions/target`

Questi file o directory possono essere rigenerati.

## Da leggere prima di toccare qualcosa

- se cambi UI del flow: [auth/keycloakify/README.md](C:/Users/danie/workspace/Opex/Opex-main/auth/keycloakify/README.md)
- se cambi logica server-side del flow: [auth/extensions/keycloak-onboarding-actions/README.md](C:/Users/danie/workspace/Opex/Opex-main/auth/extensions/keycloak-onboarding-actions/README.md)
- se cambi bootstrap o setup locale: [auth/scripts/README.md](C:/Users/danie/workspace/Opex/Opex-main/auth/scripts/README.md)
