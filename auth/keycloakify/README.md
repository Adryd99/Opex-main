# Keycloakify Theme

Questa cartella contiene il tema custom Keycloak di Opex basato su Keycloakify.

## Responsabilita

Questa cartella gestisce solo il lato presentazionale del flow:

- login
- register
- reset password
- logout confirm
- pagine custom dell'onboarding
- pagine standard Keycloak customizzate
- branding
- CSS
- traduzioni

Questa cartella **non** deve contenere:

- logica server-side del flow
- configurazione del realm
- logica admin API di bootstrap

Quelle responsabilita stanno rispettivamente in:

- [auth/extensions/keycloak-onboarding-actions](C:/Users/danie/workspace/Opex/Opex-main/auth/extensions/keycloak-onboarding-actions)
- [auth/realm](C:/Users/danie/workspace/Opex/Opex-main/auth/realm)
- [auth/scripts](C:/Users/danie/workspace/Opex/Opex-main/auth/scripts)

## Source of truth

Source of truth del tema:

- [src/login](C:/Users/danie/workspace/Opex/Opex-main/auth/keycloakify/src/login)
  Pagine, componenti, support, i18n e CSS del tema login/onboarding.
- [src/kc.gen.ts](C:/Users/danie/workspace/Opex/Opex-main/auth/keycloakify/src/kc.gen.ts)
  Tipi generati Keycloakify.
- [ONBOARDING_ROADMAP.md](C:/Users/danie/workspace/Opex/Opex-main/auth/keycloakify/ONBOARDING_ROADMAP.md)
  Specifica funzionale e roadmap del flow.
- [src/login/assets](C:/Users/danie/workspace/Opex/Opex-main/auth/keycloakify/src/login/assets)
  Asset del tema versionati insieme ai componenti.

Source of truth operativa per build e apply locali:

- [auth/scripts/build](C:/Users/danie/workspace/Opex/Opex-main/auth/scripts/build)
- [auth/scripts/local](C:/Users/danie/workspace/Opex/Opex-main/auth/scripts/local)

## Struttura di `src/login`

La cartella [src/login](C:/Users/danie/workspace/Opex/Opex-main/auth/keycloakify/src/login) e separata per responsabilita:

- [pages/auth](C:/Users/danie/workspace/Opex/Opex-main/auth/keycloakify/src/login/pages/auth)
  Login, register, reset password, verify email.
- [pages/onboarding](C:/Users/danie/workspace/Opex/Opex-main/auth/keycloakify/src/login/pages/onboarding)
  Security choice, TOTP, profile, country, occupation, legal, WebAuthn.
- [pages/system](C:/Users/danie/workspace/Opex/Opex-main/auth/keycloakify/src/login/pages/system)
  Info, terms, logout confirm.
- [components](C:/Users/danie/workspace/Opex/Opex-main/auth/keycloakify/src/login/components)
  Componenti condivisi del tema.
- [support](C:/Users/danie/workspace/Opex/Opex-main/auth/keycloakify/src/login/support)
  Helper non UI.
- file root come [KcPage.tsx](C:/Users/danie/workspace/Opex/Opex-main/auth/keycloakify/src/login/KcPage.tsx), [Template.tsx](C:/Users/danie/workspace/Opex/Opex-main/auth/keycloakify/src/login/Template.tsx), [KcContext.ts](C:/Users/danie/workspace/Opex/Opex-main/auth/keycloakify/src/login/KcContext.ts), [i18n.ts](C:/Users/danie/workspace/Opex/Opex-main/auth/keycloakify/src/login/i18n.ts) e [main.css](C:/Users/danie/workspace/Opex/Opex-main/auth/keycloakify/src/login/main.css)

## Differenza tra tema, estensioni e realm settings

### Tema

Decide:

- cosa vede l'utente
- come sono composte le pagine
- come sono tradotti i testi
- come si presentano errori, bottoni, layout e modal

### Estensioni Java

Decidono:

- quando uno step si mostra o si salta
- come funzionano `Back` e `Skip`
- come vengono salvati attributi su Keycloak
- come si comportano TOTP, WebAuthn e legal acceptance lato server

### Realm settings

Decidono:

- quali required actions sono registrate e default
- quali locale sono supportate
- SMTP
- Google broker
- token mappers
- login settings
- user profile settings

## Build locale

Comando consigliato dal root:

```powershell
.\auth\scripts\build\build-local-theme.ps1 -RestartKeycloak
```

Lo script:

- installa `node_modules` se mancano usando il lockfile disponibile
- usa `mvn` se disponibile
- altrimenti scarica Maven in `auth/keycloakify/.tools`
- builda il progetto Vite/TypeScript
- esegue `keycloakify build`
- copia il jar in [auth/themes/keycloak-theme-opex.jar](C:/Users/danie/workspace/Opex/Opex-main/auth/themes/keycloak-theme-opex.jar)
- riavvia il container `keycloak` solo se passi `-RestartKeycloak`

## Bootstrap locale completo

Se vuoi riallineare tutto il layer auth locale, non partire da qui ma dal bootstrap unico:

```powershell
.\auth\scripts\local\bootstrap-auth-local.ps1
```

Quel comando:

- builda tema e provider
- applica i setting locali del realm
- riallinea flow e token mappers

## Apply locali rilevanti per il tema

Il tema dipende anche da alcune configurazioni realm applicate dagli script:

- [apply-local-languages.ps1](C:/Users/danie/workspace/Opex/Opex-main/auth/scripts/local/apply-local-languages.ps1)
  Lingue supportate e default locale.
- [apply-local-login-settings.ps1](C:/Users/danie/workspace/Opex/Opex-main/auth/scripts/local/apply-local-login-settings.ps1)
  Reset password e altri login settings.
- [apply-local-user-profile-settings.ps1](C:/Users/danie/workspace/Opex/Opex-main/auth/scripts/local/apply-local-user-profile-settings.ps1)
  `unmanagedAttributePolicy = ENABLED`, importante per gli attributi custom salvati dal flow.
- [apply-local-smtp-settings.ps1](C:/Users/danie/workspace/Opex/Opex-main/auth/scripts/local/apply-local-smtp-settings.ps1)
  SMTP per verify email.
- [apply-local-google-idp.ps1](C:/Users/danie/workspace/Opex/Opex-main/auth/scripts/local/apply-local-google-idp.ps1)
  Broker Google e mapping base.

## Output runtime

Il runtime locale non legge `src` direttamente. Legge il jar theme buildato in:

- [auth/themes/keycloak-theme-opex.jar](C:/Users/danie/workspace/Opex/Opex-main/auth/themes/keycloak-theme-opex.jar)

Se modifichi il tema e non rebuildi, Keycloak continuera a mostrare la versione precedente.

## Packaging Docker

Per il runtime locale il tema viene ancora buildato in [auth/themes/keycloak-theme-opex.jar](C:/Users/danie/workspace/Opex/Opex-main/auth/themes/keycloak-theme-opex.jar).

Per l'immagine Docker `auth`, invece, il packaging non dipende piu da quel jar: [auth/Dockerfile](C:/Users/danie/workspace/Opex/Opex-main/auth/Dockerfile) builda il tema direttamente dai sorgenti di questa cartella.

## Sorgente vs artefatti generati

### Sorgente vero

- [src](C:/Users/danie/workspace/Opex/Opex-main/auth/keycloakify/src)
- [package.json](C:/Users/danie/workspace/Opex/Opex-main/auth/keycloakify/package.json)
- [tsconfig.json](C:/Users/danie/workspace/Opex/Opex-main/auth/keycloakify/tsconfig.json)
- [vite.config.ts](C:/Users/danie/workspace/Opex/Opex-main/auth/keycloakify/vite.config.ts)
- [README.md](C:/Users/danie/workspace/Opex/Opex-main/auth/keycloakify/README.md)
- [ONBOARDING_ROADMAP.md](C:/Users/danie/workspace/Opex/Opex-main/auth/keycloakify/ONBOARDING_ROADMAP.md)

### Artefatti generati

- `dist`
- `dist_keycloak`
- `node_modules`
- `.tools`

Queste directory possono essere rigenerate.

## Quando modificare qui e quando no

Modifica qui se devi:

- cambiare UI/UX del flow
- cambiare copy o i18n
- cambiare layout, progress bar, modal o styling
- aggiungere o customizzare una pagina Keycloak

Non modificare qui se devi:

- cambiare la logica di uno step
- cambiare quando uno step si attiva o si salta
- cambiare salvataggi attributi user
- cambiare configurazione SMTP, Google, token mappers o realm

In quei casi guarda:

- [auth/extensions/keycloak-onboarding-actions](C:/Users/danie/workspace/Opex/Opex-main/auth/extensions/keycloak-onboarding-actions)
- [auth/scripts](C:/Users/danie/workspace/Opex/Opex-main/auth/scripts)
- [auth/realm](C:/Users/danie/workspace/Opex/Opex-main/auth/realm)

## Riferimenti

- [Keycloakify documentation](https://docs.keycloakify.dev/)
- [Keycloakify testing docs](https://docs.keycloakify.dev/testing-your-theme)
