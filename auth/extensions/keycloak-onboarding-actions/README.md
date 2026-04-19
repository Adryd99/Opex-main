# Keycloak Onboarding Actions

Questa cartella contiene il modulo Java che estende Keycloak per il flow custom di Opex.

Qui vive il lato server-side del flow:

- required actions custom
- salvataggio attributi utente su Keycloak
- navigazione `Back` / `Skip`
- supporto ai rami Google, TOTP e WebAuthn
- cambio password custom lanciato dall'app

Il tema e la configurazione del realm restano fuori da questo modulo.

## Cosa gestisce questo modulo

Le estensioni decidono:

- quando mostrare uno step custom
- quando saltarlo
- quali attributi user leggere o scrivere
- come gestire la navigazione tra step
- come trattare diversamente login `email + password` e login Google

Questo modulo non gestisce:

- layout, CSS, i18n o branding
- SMTP
- Google IDP configuration
- token mappers
- ordine e requirement dei flow browser

Quelle responsabilita stanno in:

- [../../keycloakify](../../keycloakify)
- [../../scripts](../../scripts)
- [../../realm](../../realm)

## Source of truth

- [src/main/java](./src/main/java)
- [src/main/resources/META-INF/services/org.keycloak.authentication.RequiredActionFactory](./src/main/resources/META-INF/services/org.keycloak.authentication.RequiredActionFactory)
- [pom.xml](./pom.xml)
- [README.md](./README.md)

## Struttura del modulo

- [requiredactions](./src/main/java/com/opex/keycloak/onboarding/requiredactions)
  Provider e factory realmente registrati nel realm.
- [support](./src/main/java/com/opex/keycloak/onboarding/support)
  Helper server-side per broker, navigazione, second factor e URL legali.
- [constants](./src/main/java/com/opex/keycloak/onboarding/constants)
  Alias dei required actions e nomi degli attributi utente.

## Provider registrati via SPI

Il file SPI registra oggi questi provider:

- `SECURITY_SETUP_CHOICE`
- `OPEX_UPDATE_PASSWORD`
- `OPTIONAL_CONFIGURE_TOTP`
- `OPTIONAL_WEBAUTHN_REGISTER`
- `PROFILE_BASICS`
- `COUNTRY_SELECTION`
- `OCCUPATION`
- `LEGAL_ACCEPTANCE`

## Ruolo dei provider principali

### `SECURITY_SETUP_CHOICE`

Provider:
- [SecuritySetupChoiceRequiredAction.java](./src/main/java/com/opex/keycloak/onboarding/requiredactions/SecuritySetupChoiceRequiredAction.java)

Fa queste cose:

- mostra la scelta tra `totp`, `webauthn` e `later`
- salva `preferredSecondFactor`
- pulisce o riallinea lo stato del secondo fattore
- aggiunge il setup TOTP o WebAuthn corretto
- assicura che `PROFILE_BASICS` sia il passo successivo
- per login Google, salta completamente lo step e porta direttamente verso `PROFILE_BASICS`

### `OPTIONAL_CONFIGURE_TOTP`

Provider:
- [OptionalConfigureTotpRequiredAction.java](./src/main/java/com/opex/keycloak/onboarding/requiredactions/OptionalConfigureTotpRequiredAction.java)

E un wrapper del provider standard `UpdateTotp`.

Aggiunge:

- supporto al pulsante `Back`
- aggiornamento dello stato `secondFactorMethod`
- enqueue di `CONFIGURE_RECOVERY_AUTHN_CODES` dopo un setup TOTP riuscito

### `OPTIONAL_WEBAUTHN_REGISTER`

Provider:
- [OptionalWebAuthnRegister.java](./src/main/java/com/opex/keycloak/onboarding/requiredactions/OptionalWebAuthnRegister.java)

E un wrapper del provider standard `WebAuthnRegister`.

Aggiunge:

- supporto al pulsante `Back`
- aggiornamento dello stato `secondFactorMethod`
- enqueue di `CONFIGURE_RECOVERY_AUTHN_CODES` dopo un setup WebAuthn riuscito

### `PROFILE_BASICS`

Provider:
- [ProfileBasicsRequiredAction.java](./src/main/java/com/opex/keycloak/onboarding/requiredactions/ProfileBasicsRequiredAction.java)

E un wrapper di `UpdateProfile`.

Comportamento attuale:

- richiede solo i campi davvero mancanti
- usa `firstName`, `lastName`, `birthDate`
- valida `birthDate` in formato ISO
- impone eta minima di 18 anni
- supporta `Back` verso `SECURITY_SETUP_CHOICE`
- se il login arriva da Google, puo nascondere nome e cognome gia presenti e chiedere solo cio che manca

### `COUNTRY_SELECTION`, `OCCUPATION`, `LEGAL_ACCEPTANCE`

Questi provider raccolgono e persistono gli attributi aggiuntivi Opex necessari per completare il profilo.

Insieme a `OnboardingStepNavigationSupport`, mantengono coerente il passaggio da uno step al successivo e il ritorno ai passi precedenti quando serve.

### `OPEX_UPDATE_PASSWORD`

Provider:
- [OpexUpdatePasswordRequiredAction.java](./src/main/java/com/opex/keycloak/onboarding/requiredactions/OpexUpdatePasswordRequiredAction.java)

E il cambio password custom lanciato da `Settings > Security`.

Comportamento attuale:

- richiede `password-current`
- valida davvero la password corrente via credential manager
- valida nuova password e conferma
- supporta `logout-sessions`
- aggiorna la credenziale direttamente
- renderizza `login-update-password.ftl`
- imposta `opexCurrentPasswordRequired = true` per il tema
- usa un `max auth age` molto alto, perche la vera verifica forte viene fatta sul campo `password-current`

## Support classes importanti

- [BrokeredIdentitySupport.java](./src/main/java/com/opex/keycloak/onboarding/support/BrokeredIdentitySupport.java)
  Rileva e ricorda il provider broker corrente, in particolare Google.
- [OnboardingStepNavigationSupport.java](./src/main/java/com/opex/keycloak/onboarding/support/OnboardingStepNavigationSupport.java)
  Implementa la logica comune `Back`, `Skip`, forced display e resume del required action sospeso.
- [SecuritySetupFlowSupport.java](./src/main/java/com/opex/keycloak/onboarding/support/SecuritySetupFlowSupport.java)
  Gestisce il ritorno dallo step TOTP/WebAuthn verso `SECURITY_SETUP_CHOICE`.
- [SecondFactorSupport.java](./src/main/java/com/opex/keycloak/onboarding/support/SecondFactorSupport.java)
  Aggiorna lo stato del secondo fattore e aggiunge i recovery codes come step successivo quando necessario.
- [LegalUrlSupport.java](./src/main/java/com/opex/keycloak/onboarding/support/LegalUrlSupport.java)
  Calcola gli URL dei documenti legali esposti al tema.

## Flow server-side attuale

### Nuovo utente `email + password`

Sequenza logica:

1. `SECURITY_SETUP_CHOICE`
2. `OPTIONAL_CONFIGURE_TOTP` oppure `OPTIONAL_WEBAUTHN_REGISTER`, oppure salto con `later`
3. `CONFIGURE_RECOVERY_AUTHN_CODES` se il secondo fattore principale e stato configurato e i recovery codes mancano
4. `PROFILE_BASICS`
5. `COUNTRY_SELECTION`
6. `OCCUPATION`
7. `LEGAL_ACCEPTANCE`

### Nuovo utente Google

Sequenza logica:

1. broker login / link existing account
2. `SECURITY_SETUP_CHOICE` viene saltato da `SecuritySetupChoiceRequiredAction`
3. `PROFILE_BASICS` chiede solo i dati mancanti
4. `COUNTRY_SELECTION`
5. `OCCUPATION`
6. `LEGAL_ACCEPTANCE`

Nota:

- il first broker login flow e il post-broker flow vengono configurati dagli script realm, non da questo modulo
- questo modulo si limita a comportarsi correttamente quando il contesto corrente arriva da Google

### App-initiated actions

Questo modulo partecipa direttamente solo al cambio password custom:

- `OPEX_UPDATE_PASSWORD`

Le altre AIA principali (`CONFIGURE_TOTP`, `webauthn-register`, `CONFIGURE_RECOVERY_AUTHN_CODES`) usano provider standard Keycloak configurati dagli script di realm.

## Cosa resta standard Keycloak

Questo modulo non sostituisce tutto Keycloak. Restano standard:

- `CONFIGURE_TOTP`
- `webauthn-register`
- `CONFIGURE_RECOVERY_AUTHN_CODES`
- `VERIFY_EMAIL`
- `UPDATE_PROFILE`
- gli authenticator del browser flow:
  - OTP form
  - WebAuthn authenticator
  - Recovery authentication code form

Gli script decidono come registrarli, ordinarli e configurarli.

## URL legali esposti al tema

`LEGAL_ACCEPTANCE` espone al tema:

- `privacyUrl`
- `termsUrl`
- `cookiesUrl`
- `legalApiUrl`

Valori di default in locale:

- app base URL: `http://localhost:3000`
- legal public API: `http://localhost:8080/api/legal/public`

Override supportati:

- `OPEX_LEGAL_APP_BASE_URL`
- `OPEX_LEGAL_API_PUBLIC_URL`

## Verify email

La verify email non e implementata qui come step custom.

Il flow attuale resta:

- backend Opex -> `sendVerifyEmail(...)`
- Keycloak -> SMTP del realm
- tema -> solo rendering della pagina di verify email

Quindi:

- SMTP e send email non vivono in questo modulo
- la verifica email non fa parte del blocco onboarding custom

## Build locale

Dal root del repository:

```powershell
.\auth\scripts\build\build-local-provider.ps1 -RestartKeycloak
```

Lo script:

- esegue `mvn -DskipTests package`
- copia il jar finale in `auth/themes/keycloak-onboarding-actions.jar`
- riavvia Keycloak solo se richiesto

## Bootstrap locale completo

Se vuoi riallineare tutto il layer auth locale:

```powershell
.\auth\scripts\local\bootstrap-auth-local.ps1
```

Se invece stai iterando solo su questo modulo, in genere ti servono:

```powershell
.\auth\scripts\build\build-local-provider.ps1 -RestartKeycloak
.\auth\scripts\local\apply-local-security-setup-choice.ps1
.\auth\scripts\local\apply-local-profile-basics.ps1
.\auth\scripts\local\apply-local-country-selection.ps1
.\auth\scripts\local\apply-local-occupation.ps1
.\auth\scripts\local\apply-local-legal-acceptance.ps1
```

## Output runtime e packaging

Runtime locale:

- [../../themes/keycloak-onboarding-actions.jar](../../themes/keycloak-onboarding-actions.jar)

Il [../../Dockerfile](../../Dockerfile) non dipende da questo jar gia buildato: compila il provider direttamente dai sorgenti del modulo.

## Sorgente vs artefatti generati

### Sorgente vero

- [src](./src)
- [pom.xml](./pom.xml)
- [README.md](./README.md)

### Artefatti generati

- `target`
- [../../themes/keycloak-onboarding-actions.jar](../../themes/keycloak-onboarding-actions.jar)

`target` puo essere rigenerato. Il jar sotto `auth/themes` e solo l'artefatto runtime locale.

## Quando modificare qui e quando no

Modifica qui se devi:

- cambiare la logica di uno step onboarding
- cambiare la navigazione `Back` / `Skip`
- cambiare il modo in cui vengono salvati attributi user
- cambiare il comportamento dei rami Google / TOTP / WebAuthn
- cambiare il password update custom lanciato dall'app

Non modificare qui se devi:

- cambiare layout, CSS o copy
- cambiare traduzioni
- cambiare SMTP
- cambiare Google IDP o token mappers
- cambiare requirement del browser flow

In quei casi guarda:

- [../../keycloakify](../../keycloakify)
- [../../scripts](../../scripts)
- [../../realm](../../realm)
