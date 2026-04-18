# Keycloak Onboarding Actions

Questa cartella contiene le estensioni Java di Keycloak usate da Opex per l'onboarding custom.

## Responsabilita

Questo modulo gestisce solo il lato server-side del flow custom:

- required actions custom
- salvataggio attributi user su Keycloak
- supporto a `Back` / `Skip`
- gestione dei rami Google / TOTP / WebAuthn
- helper per URL legali e navigazione tra step

Questo modulo **non** deve contenere:

- layout o CSS del flow
- traduzioni UI
- configurazione declarativa del realm
- script locali di bootstrap

Quelle responsabilita stanno rispettivamente in:

- [auth/keycloakify](C:/Users/danie/workspace/Opex/Opex-main/auth/keycloakify)
- [auth/realm](C:/Users/danie/workspace/Opex/Opex-main/auth/realm)
- [auth/scripts](C:/Users/danie/workspace/Opex/Opex-main/auth/scripts)

## Source of truth

Source of truth di questo modulo:

- [src/main/java](C:/Users/danie/workspace/Opex/Opex-main/auth/extensions/keycloak-onboarding-actions/src/main/java)
- [src/main/resources/META-INF/services/org.keycloak.authentication.RequiredActionFactory](C:/Users/danie/workspace/Opex/Opex-main/auth/extensions/keycloak-onboarding-actions/src/main/resources/META-INF/services/org.keycloak.authentication.RequiredActionFactory)
- [pom.xml](C:/Users/danie/workspace/Opex/Opex-main/auth/extensions/keycloak-onboarding-actions/pom.xml)
- [README.md](C:/Users/danie/workspace/Opex/Opex-main/auth/extensions/keycloak-onboarding-actions/README.md)

## Struttura del modulo

Il codice Java e separato per responsabilita:

- [requiredactions](C:/Users/danie/workspace/Opex/Opex-main/auth/extensions/keycloak-onboarding-actions/src/main/java/com/opex/keycloak/onboarding/requiredactions)
  Provider e factory registrati davvero nel flow Keycloak.
- [support](C:/Users/danie/workspace/Opex/Opex-main/auth/extensions/keycloak-onboarding-actions/src/main/java/com/opex/keycloak/onboarding/support)
  Helper server-side per broker Google, navigazione, 2FA e URL legali.
- [constants](C:/Users/danie/workspace/Opex/Opex-main/auth/extensions/keycloak-onboarding-actions/src/main/java/com/opex/keycloak/onboarding/constants)
  Nomi condivisi per attributi user e IDs delle required actions.

## Provider registrati via SPI

Le classi effettivamente registrate su Keycloak stanno in:

- [RequiredActionFactory SPI file](C:/Users/danie/workspace/Opex/Opex-main/auth/extensions/keycloak-onboarding-actions/src/main/resources/META-INF/services/org.keycloak.authentication.RequiredActionFactory)

Provider attuali:

- `SECURITY_SETUP_CHOICE`
- `PROFILE_BASICS`
- `COUNTRY_SELECTION`
- `OCCUPATION`
- `LEGAL_ACCEPTANCE`
- wrapper opzionali per TOTP e WebAuthn

## Differenza tra tema, estensioni e realm settings

### Estensioni Java

Decidono:

- quando uno step si attiva
- quando uno step si auto-salta
- come si comporta `Back`
- come vengono salvati attributi custom
- come vengono orchestrati i rami Google / TOTP / WebAuthn

### Tema

Decide:

- come si mostra uno step
- come sono fatti i form
- copy, pulsanti, messaggi, modal

### Realm settings

Decidono:

- se una required action esiste davvero nel realm
- se e default o no
- in che ordine appare
- SMTP, Google IDP, token mappers, user profile settings

## Build locale

Dal root del repository:

```powershell
.\auth\scripts\build\build-local-provider.ps1 -RestartKeycloak
```

Lo script:

- usa `mvn` se disponibile
- altrimenti riusa Maven locale scaricato in `auth/keycloakify/.tools`
- esegue `mvn -DskipTests package`
- copia il jar finale in [auth/themes/keycloak-onboarding-actions.jar](C:/Users/danie/workspace/Opex/Opex-main/auth/themes/keycloak-onboarding-actions.jar)
- riavvia il container `keycloak` solo se passi `-RestartKeycloak`

## Bootstrap locale

Se vuoi riallineare tutto il layer auth locale, usa il bootstrap unico:

```powershell
.\auth\scripts\local\bootstrap-auth-local.ps1
```

Se invece stai iterando solo sul flow server-side, ti interessano soprattutto:

```powershell
.\auth\scripts\build\build-local-provider.ps1 -RestartKeycloak
.\auth\scripts\local\apply-local-security-setup-choice.ps1
.\auth\scripts\local\apply-local-profile-basics.ps1
.\auth\scripts\local\apply-local-country-selection.ps1
.\auth\scripts\local\apply-local-occupation.ps1
.\auth\scripts\local\apply-local-legal-acceptance.ps1
.\auth\scripts\local\apply-local-token-mappers.ps1
```

## Stato del flow locale

Dopo aver applicato tutti gli script locali:

- `SECURITY_SETUP_CHOICE` e il primo step del blocco sicurezza
- `CONFIGURE_TOTP` disponibile ma non default
- `webauthn-register` disponibile ma non default
- seguono `PROFILE_BASICS`, `COUNTRY_SELECTION`, `OCCUPATION`, `LEGAL_ACCEPTANCE`
- `UPDATE_PROFILE` non viene piu usato come default action

## Legal URLs

`LEGAL_ACCEPTANCE` espone al tema anche:

- `privacyUrl`
- `termsUrl`
- `cookiesUrl`
- `legalApiUrl`

Per default in locale usa:

- app: `http://localhost:3000`
- API pubblica: `http://localhost:8080/api/legal/public`

Per ambienti diversi puoi passare:

- `OPEX_LEGAL_APP_BASE_URL`
- `OPEX_LEGAL_API_PUBLIC_URL`

## Verify email nei settings

La verifica email non fa parte di questo onboarding custom.

L'app Opex usa il flusso standard Keycloak:

- il frontend chiama il backend Opex
- il backend invoca `sendVerifyEmail(...)` su Keycloak
- Keycloak invia il link usando lo SMTP configurato sul realm
- per utenti `Google`, `emailVerified` resta confermato automaticamente

Quindi:

- SMTP e logica verify email vivono a livello realm / backend
- questo modulo Java non implementa un suo step custom di verify email nell'onboarding

## Claims sincronizzati

Lo script [apply-local-token-mappers.ps1](C:/Users/danie/workspace/Opex/Opex-main/auth/scripts/local/apply-local-token-mappers.ps1) crea o aggiorna la client scope `opex-onboarding` e pubblica:

- `birthDate`
- `country`
- `occupation`
- `profilePicture`
- `identityProvider`
- `legalAccepted`

in access token, ID token e userinfo.

## Regole broker Google

- se l'utente entra da `email + password`, vede `SECURITY_SETUP_CHOICE`
- se l'utente entra da `Google`, `SECURITY_SETUP_CHOICE` viene saltato
- `PROFILE_BASICS` usa i dati gia presenti in Keycloak e chiede solo i campi mancanti
- `birthDate` resta un dato raccolto da Opex anche nei login Google

## Output runtime

Il runtime locale non legge `src` direttamente. Legge il jar buildato in:

- [auth/themes/keycloak-onboarding-actions.jar](C:/Users/danie/workspace/Opex/Opex-main/auth/themes/keycloak-onboarding-actions.jar)

Se modifichi Java e non rebuildi il jar, Keycloak continuera a usare la versione precedente.

## Packaging Docker

Per il runtime locale il provider viene ancora buildato in [auth/themes/keycloak-onboarding-actions.jar](C:/Users/danie/workspace/Opex/Opex-main/auth/themes/keycloak-onboarding-actions.jar).

Per l'immagine Docker `auth`, invece, il packaging non dipende piu da quel jar: [auth/Dockerfile](C:/Users/danie/workspace/Opex/Opex-main/auth/Dockerfile) builda il provider direttamente dai sorgenti di questo modulo.

## Sorgente vs artefatti generati

### Sorgente vero

- [src](C:/Users/danie/workspace/Opex/Opex-main/auth/extensions/keycloak-onboarding-actions/src)
- [pom.xml](C:/Users/danie/workspace/Opex/Opex-main/auth/extensions/keycloak-onboarding-actions/pom.xml)
- [README.md](C:/Users/danie/workspace/Opex/Opex-main/auth/extensions/keycloak-onboarding-actions/README.md)

### Artefatti generati

- `target`
- [auth/themes/keycloak-onboarding-actions.jar](C:/Users/danie/workspace/Opex/Opex-main/auth/themes/keycloak-onboarding-actions.jar)

`target` puo essere eliminato e rigenerato. Il jar in `auth/themes` e un artefatto runtime buildato localmente.

## Quando modificare qui e quando no

Modifica qui se devi:

- cambiare la logica di uno step onboarding
- cambiare salvataggio attributi user
- cambiare la logica `Back` / `Skip`
- cambiare comportamento dei rami Google / TOTP / WebAuthn

Non modificare qui se devi:

- cambiare il layout del flow
- cambiare CSS, copy o traduzioni
- cambiare SMTP, Google IDP, locale, token mappers o configurazione realm

In quei casi guarda:

- [auth/keycloakify](C:/Users/danie/workspace/Opex/Opex-main/auth/keycloakify)
- [auth/scripts](C:/Users/danie/workspace/Opex/Opex-main/auth/scripts)
- [auth/realm](C:/Users/danie/workspace/Opex/Opex-main/auth/realm)
