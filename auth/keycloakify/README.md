# Keycloakify Theme

Questa cartella contiene il tema custom Keycloak di Opex basato su Keycloakify.

Qui vive solo il lato presentazionale del flow:

- login
- register
- onboarding
- password update
- second-factor pages
- verify email pages
- logout / info / legal pages
- branding, CSS e i18n

La logica server-side resta fuori da questa cartella.

## Cosa gestisce questa cartella

Il tema decide:

- quali pagine Keycloak ricevono una UI React custom
- layout, spacing e branding
- copy e traduzioni
- progress bar onboarding
- modal e schermate second-factor
- differenza visiva tra onboarding e app-initiated actions

Questa cartella non decide:

- quando uno step si attiva o si salta
- ordine e priorita dei required actions
- Google IDP, SMTP, token mappers o flow browser

Quelle responsabilita stanno rispettivamente in:

- [../extensions/keycloak-onboarding-actions](../extensions/keycloak-onboarding-actions)
- [../scripts](../scripts)
- [../realm](../realm)

## Source of truth

Source of truth del tema:

- [src/login](./src/login)
  Pagine, componenti, support, CSS e i18n del login/onboarding.
- [src/kc.gen.ts](./src/kc.gen.ts)
  Tipi generati Keycloakify.
- [ONBOARDING_ROADMAP.md](./ONBOARDING_ROADMAP.md)
  Specifica funzionale del flow desiderato e delle sue scelte.

Output runtime locale:

- [../themes/keycloak-theme-opex.jar](../themes/keycloak-theme-opex.jar)

## Struttura di `src/login`

- [src/login/pages/auth](./src/login/pages/auth)
  Login, register, verify email, password update, OTP, recovery code input, passkey auth.
- [src/login/pages/onboarding](./src/login/pages/onboarding)
  Security choice, TOTP setup, WebAuthn setup, profile basics, country, occupation, legal acceptance.
- [src/login/pages/system](./src/login/pages/system)
  Info, logout confirm, terms.
- [src/login/components](./src/login/components)
  Componenti condivisi del tema.
- [src/login/support](./src/login/support)
  Helper non UI.
- file root come:
  - [KcPage.tsx](./src/login/KcPage.tsx)
  - [Template.tsx](./src/login/Template.tsx)
  - [KcContext.ts](./src/login/KcContext.ts)
  - [i18n.ts](./src/login/i18n.ts)
  - [main.css](./src/login/main.css)

## Pagine `.ftl` custom attualmente coperte

`KcPage.tsx` mappa esplicitamente queste pagine:

### Auth e login

- `login.ftl`
- `register.ftl`
- `info.ftl`
- `login-update-password.ftl`
- `login-verify-email.ftl`
- `login-idp-link-confirm.ftl`
- `login-idp-link-email.ftl`
- `logout-confirm.ftl`
- `terms.ftl`

### Second factor e login alternatives

- `login-config-totp.ftl`
- `login-otp.ftl`
- `login-passkeys-conditional-authenticate.ftl`
- `webauthn-authenticate.ftl`
- `select-authenticator.ftl`
- `login-recovery-authn-code-config.ftl`
- `login-recovery-authn-code-input.ftl`
- `webauthn-register.ftl`

### Onboarding Opex

- `security-setup-choice.ftl`
- `login-update-profile.ftl`
- `country-selection.ftl`
- `occupation.ftl`
- `legal-acceptance.ftl`

Per pagine non mappate esplicitamente, il fallback resta `DefaultPage`.

## Comportamento condiviso del template

Il file [Template.tsx](./src/login/Template.tsx) e il punto centrale della UI comune.

Comportamenti importanti:

- usa il logo brand del login
- gestisce il language switch del tema
- salva la lingua auth in `localStorage` sotto `opex_auth_locale`
- supporta solo `it` e `en`
- se non trova una preferenza salvata, forza l'italiano
- imposta `document.documentElement.lang` coerentemente

### Progress bar onboarding

La progress bar appare solo quando la pagina appartiene davvero al flow onboarding.

Viene nascosta quando:

- la pagina e una second-factor page di login
- la pagina arriva da un'app-initiated action lanciata dall'app Opex

Questo evita di mostrare step `Account / Security / Profile / ...` durante:

- cambio password dai settings
- setup 2FA dai settings
- login con OTP, passkey o recovery code

### Try another way

Il template contiene anche il wiring necessario per:

- `Try another way`
- cambio metodo tra OTP, WebAuthn e recovery code

Questo wiring e importante perche alcune pagine usano il comportamento standard atteso dal JavaScript Keycloak.

## Rapporto con le estensioni Java

Il tema rende i form, ma non contiene la logica del flow.

Esempi:

- la pagina `security-setup-choice.ftl` viene renderizzata qui, ma la scelta `totp / webauthn / later` viene interpretata lato server dal provider Java
- `login-update-password.ftl` e una pagina custom del tema, ma la validazione della password attuale avviene nel provider `OPEX_UPDATE_PASSWORD`
- `login-update-profile.ftl` mostra i campi, ma e `PROFILE_BASICS` a decidere quali campi sono obbligatori o gia soddisfatti

Se devi cambiare la logica del flow, non farlo qui:

- [../extensions/keycloak-onboarding-actions](../extensions/keycloak-onboarding-actions)

## Build locale

Dal root del repository:

```powershell
.\auth\scripts\build\build-local-theme.ps1 -RestartKeycloak
```

Lo script:

- installa `node_modules` se mancano
- builda il progetto TypeScript/Vite
- esegue `keycloakify build`
- copia il jar in `auth/themes/keycloak-theme-opex.jar`
- riavvia Keycloak solo se richiesto

## Bootstrap auth completo

Se vuoi riallineare tutto il layer auth locale, non partire dal package di questa cartella ma dal bootstrap unico:

```powershell
.\auth\scripts\local\bootstrap-auth-local.ps1
```

Quel comando:

- builda tema e provider
- applica il realm locale
- riallinea flow, required actions, lingue, SMTP, Google e token mappers

## Cosa cambiare qui e cosa no

Modifica qui se devi:

- cambiare layout, CSS o spacing
- cambiare copy o i18n
- cambiare progress bar, hero o modal
- aggiungere una pagina Keycloak custom
- rifinire OTP, passkey, recovery code o onboarding dal lato UI

Non modificare qui se devi:

- cambiare quando uno step si mostra o si salta
- cambiare i dati scritti sugli utenti Keycloak
- cambiare ordine, priorita o stato delle required actions
- cambiare SMTP, Google IDP, token mappers o browser flow

In quei casi guarda:

- [../extensions/keycloak-onboarding-actions](../extensions/keycloak-onboarding-actions)
- [../scripts](../scripts)
- [../realm](../realm)

## Sorgente vs artefatti generati

### Sorgente vero

- [src](./src)
- [package.json](./package.json)
- [tsconfig.json](./tsconfig.json)
- [vite.config.ts](./vite.config.ts)
- [README.md](./README.md)
- [ONBOARDING_ROADMAP.md](./ONBOARDING_ROADMAP.md)

### Artefatti generati

- `dist`
- `dist_keycloak`
- `node_modules`
- `.tools`

Queste directory possono essere rigenerate.

## Riferimenti

- [Keycloakify documentation](https://docs.keycloakify.dev/)
- [Keycloakify testing docs](https://docs.keycloakify.dev/testing-your-theme)
