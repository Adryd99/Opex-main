# Keycloak Onboarding Roadmap

## Goal

Move the user onboarding into Keycloak while keeping Opex as a synchronized copy of the user profile.

Main building blocks:

- `keycloakify` for the custom UI
- Keycloak built-in flows where possible
- custom Keycloak required actions where needed
- backend sync in Opex after login

---

## Current Direction

The login and onboarding flow must stay simple:

- existing login remains based on `email + password`
- onboarding remains for `new users only`
- security setup must become `optional`
- the user must explicitly choose what to do

Important decision:

- do **not** introduce passwordless login now
- if we add WebAuthn now, use it as an optional **second factor**
- full passkey-first or passwordless login can be a later dedicated project

This avoids breaking the current login UX that already works.

---

## Final Target Flow

For new users only:

1. Account creation or external identity sign-in
2. Conditional security setup choice
3. Optional security setup execution
4. Conditional profile basics completion
5. Country selection
6. Occupation
7. Legal acceptance

For existing users:

- normal login flow
- no onboarding required actions unless explicitly re-triggered

Behavior rules:

- if the user stops halfway, the next login resumes from the first incomplete step
- after completion, the onboarding steps must not reappear
- if legal version changes, only `LEGAL_ACCEPTANCE` must reappear
- `Verify Email` must stay outside onboarding and be triggered from Opex settings using the standard Keycloak email link flow

---

## Authentication Entry Points

The onboarding must support these entry points:

- `email + password`
- `Google`

Google must be configured as a Keycloak identity provider and treated as a brokered login, not as a separate Opex registration system.

Behavior rules:

- a Google user already linked to a Keycloak account signs in directly
- a new Google user creates a new Keycloak user and then enters onboarding
- if a Google email matches an existing Keycloak user, account linking must be explicit and verified, not automatic and silent

Recommended button label:

- `Continue with Google`

Recommended placement:

- show the same Google button in both `Login` and `Register`

---

## Flow Matrix

### Email and password: new user

1. Register with email and password
2. `SECURITY_SETUP_CHOICE`
3. Optional `CONFIGURE_TOTP` or optional `Webauthn Register`
4. `PROFILE_BASICS`
5. `COUNTRY_SELECTION`
6. `OCCUPATION`
7. `LEGAL_ACCEPTANCE`

### Google: new user

1. Continue with Google
2. Skip `SECURITY_SETUP_CHOICE`
3. Skip local password setup entirely
4. Run `PROFILE_BASICS` only for missing mandatory profile data
5. `COUNTRY_SELECTION`
6. `OCCUPATION`
7. `LEGAL_ACCEPTANCE`

### Google: existing linked user

1. Continue with Google
2. Sign in directly
3. No onboarding unless a required action is still incomplete

### Google: existing unlinked user with matching email

1. Continue with Google
2. Explicit account linking flow
3. After successful linking, continue like an existing linked user

---

## Security Setup Strategy

## UX requirement

The user must choose between:

- `Authenticator app`
- `Security key or passkey`
- `Do this later`

The security step must be optional.

Broker rule:

- if the user came from `email + password`, the choice must be shown
- if the user came from `Google`, the choice must be skipped

## Flow behavior

If the user chooses:

- `Authenticator app`
  - continue with built-in `CONFIGURE_TOTP`
- `Security key or passkey`
  - continue with built-in `Webauthn Register`
- `Do this later`
  - skip second-factor enrollment and continue to `PROFILE_BASICS`

## Why this design

This keeps the current authentication model stable:

- first factor remains `email + password`
- TOTP becomes an optional second factor
- WebAuthn becomes an optional second factor
- no passwordless login change is required now

This is the safest way to add WebAuthn without polluting the existing flow.

---

## Data Model Decisions

### Standard fields

- `firstName`
- `lastName`

### Custom user attributes

- `birthDate`
- `country`
- `occupation`
- `preferredSecondFactor`
- `secondFactorEnrollmentDeferred`
- `secondFactorMethod`
- `secondFactorConfiguredAt`
- `legalAccepted`
- `legalAcceptedAt`
- `legalVersion`
- `termsAccepted`
- `privacyAccepted`
- `cookiePolicyAcknowledged`

Optional if needed later:

- `termsAcceptedAt`
- `privacyAcceptedAt`
- `cookiePolicyAcknowledgedAt`

### Security state meaning

- `preferredSecondFactor`
  - `totp`
  - `webauthn`
  - `later`
- `secondFactorEnrollmentDeferred`
  - `true` when the user explicitly skipped setup
- `secondFactorMethod`
  - actual configured second factor
  - expected values now:
    - `totp`
    - `webauthn`
- `secondFactorConfiguredAt`
  - timestamp when the method was successfully configured

This lets Opex distinguish:

- the user skipped intentionally
- the user chose a method but did not complete it yet
- the user completed the setup

---

## Validation Rules

### PROFILE_BASICS

- `firstName`: required, max `100`
- `lastName`: required, max `100`
- `birthDate`: required
- `birthDate` storage format: ISO date (`YYYY-MM-DD`)
- age rule: user must be at least `18`
- when the user comes from Google:
  - `firstName` and `lastName` must be reused from Google if already present
  - the form should only ask for fields that are still missing
  - `birthDate` must still be collected by Opex unless a future enhancement reliably provides it

Reason for `birthDate` fallback:

- standard Google OIDC login gives stable profile data like email and name
- `birthDate` is not part of the standard brokered profile we can rely on today
- reading birthdays would require extra Google API integration and additional user consent scopes
- therefore `birthDate` remains an Opex-collected field for now

### COUNTRY_SELECTION

- `country`: required
- stored as ISO code
- allowed values:
  - `IT`
  - `NL`
  - `BE`
  - `DE`
- labels shown in the theme language

### OCCUPATION

- `occupation`: required
- free text
- max `100`

### LEGAL_ACCEPTANCE

Public legal documents already exist in the app:

- `/legal/privacy`
- `/legal/terms`
- `/legal/cookies`

UI rules:

- `Terms of Service` checkbox is mandatory
- `Privacy Policy` checkbox is mandatory
- cookies choice must exist:
  - accept
  - reject non-essential cookies
- if the user rejects non-essential cookies, the UI must still explain that strictly necessary cookies remain required

Persistence must stay compatible with the existing backend legal model:

- `privacyPolicyVersion`
- `privacyAcceptedAt`
- `termsOfServiceVersion`
- `termsAcceptedAt`
- optional `cookiePolicyVersion`
- optional `cookiePolicyAcknowledgedAt`
- a combined completion flag in Keycloak can still exist for flow completion

---

## Token And Sync Decisions

### Claims to expose in token

- `birthDate`
- `country`
- `occupation`
- `legalAccepted`

Standard user fields already available from Keycloak:

- `email`
- `firstName`
- `lastName`

Potentially later:

- `preferredSecondFactor`
- `secondFactorMethod`
- `legalVersion`

### Backend sync

The Opex backend must sync these fields from Keycloak:

- `firstName`
- `lastName`
- `birthDate`
- `country`
- `occupation`
- legal acceptance state
- cookie acknowledgement state if present
- security preference and configured method if needed by the app

Key rule:

- Keycloak is the primary source of truth
- Opex app profile is only a synchronized copy

---

## Delivery Versions

## Version 1: Stable Local Theme

Objective:

- reliable local Keycloak theme loop
- branded login and register
- no advanced security choice yet

## Version 2A: Optional Security Choice

Objective:

- add a custom `SECURITY_SETUP_CHOICE`
- let the user choose:
  - TOTP
  - WebAuthn
  - Later
- wire the choice to built-in Keycloak actions

Scope:

- custom required action `SECURITY_SETUP_CHOICE`
- built-in `CONFIGURE_TOTP`
- built-in `Webauthn Register`
- no passwordless login

## Version 2B: Complete Onboarding

Objective:

- move the full onboarding wizard into Keycloak

Scope:

- `SECURITY_SETUP_CHOICE`
- `PROFILE_BASICS`
- `COUNTRY_SELECTION`
- `OCCUPATION`
- `LEGAL_ACCEPTANCE`
- token mappers
- backend sync alignment
- remove duplicate onboarding from Opex app

---

## Custom Required Actions

### 1. SECURITY_SETUP_CHOICE

Collect:

- one of:
  - `totp`
  - `webauthn`
  - `later`

Behavior:

- if `totp` is selected:
  - enqueue built-in `CONFIGURE_TOTP`
- if `webauthn` is selected:
  - enqueue built-in `Webauthn Register`
- if `later` is selected:
  - skip second-factor enrollment
  - continue directly to `PROFILE_BASICS`

Store:

- `preferredSecondFactor`
- `secondFactorEnrollmentDeferred`

Run conditions:

- execute for users created through `email + password`
- do not execute for users entering through Google broker login

### 2. PROFILE_BASICS

Collect:

- `firstName`
- `lastName`
- `birthDate`

Store:

- standard Keycloak fields for `firstName` and `lastName`
- custom attribute `birthDate`

Run conditions:

- execute if at least one of these is missing:
  - `firstName`
  - `lastName`
  - `birthDate`
- for Google users, only missing values must be requested again
- for `email + password` users, the step normally asks for all three values

### 3. COUNTRY_SELECTION

Collect:

- one of `IT`, `NL`, `BE`, `DE`

Store:

- custom attribute `country`

### 4. OCCUPATION

Collect:

- free text occupation

Store:

- custom attribute `occupation`

### 5. LEGAL_ACCEPTANCE

Collect:

- mandatory `Terms of Service` checkbox
- mandatory `Privacy Policy` checkbox
- cookie choice referencing `/legal/cookies`

Store:

- values compatible with the existing backend legal model
- a combined legal completion state for Keycloak flow completion

---

## Recommended Delivery Order

1. Keep the local `keycloakify` theme loop stable
2. Implement `SECURITY_SETUP_CHOICE`
3. Wire optional `CONFIGURE_TOTP` and `Webauthn Register`
4. Configure Google identity provider and broker policy
5. Implement `PROFILE_BASICS`
6. Make `PROFILE_BASICS` conditional for Google users
7. Implement `COUNTRY_SELECTION`
8. Implement `OCCUPATION`
9. Implement `LEGAL_ACCEPTANCE`
10. Add token mappers
11. Update Opex backend sync
12. Remove duplicate onboarding from Opex app
13. Do an end-to-end review

---

## Prompts To Send Codex

Use these prompts one by one.

### Prompt A: Design and implement the security choice

```text
Aggiorna la roadmap e implementa in locale uno step custom SECURITY_SETUP_CHOICE nel flow dei nuovi utenti. L'utente deve poter scegliere tra Authenticator app, Security key o passkey, oppure Do this later. Non voglio passwordless login: WebAuthn deve restare un secondo fattore opzionale. Non rompere il flow attuale di email + password.
```

### Prompt B: Wire optional TOTP and WebAuthn

```text
Configura il realm locale e le estensioni necessarie per fare in modo che, dopo SECURITY_SETUP_CHOICE, il flow continui in modo condizionale: se l'utente sceglie TOTP deve partire CONFIGURE_TOTP, se sceglie WebAuthn deve partire Webauthn Register, se sceglie Later deve saltare entrambi. Non introdurre passwordless login.
```

### Prompt C: Implement PROFILE_BASICS

```text
Implementa il required action custom PROFILE_BASICS descritto in C:\Users\danie\workspace\Opex\Opex-main\auth\keycloakify\ONBOARDING_ROADMAP.md. Deve raccogliere firstName, lastName e birthDate, validare birthDate come maggiorenne, salvarli correttamente in Keycloak e mostrare la pagina tramite il tema keycloakify.
```

### Prompt C2: Add Google broker flow rules

```text
Configura in locale il provider Google in Keycloak seguendo la roadmap in C:\Users\danie\workspace\Opex\Opex-main\auth\keycloakify\ONBOARDING_ROADMAP.md. Il login Google deve saltare SECURITY_SETUP_CHOICE, non deve introdurre passwordless login, e deve trattare i nuovi utenti Google come onboarding users. Se l'email esiste gia, voglio linking esplicito dell'account.
```

### Prompt C3: Make PROFILE_BASICS conditional for Google

```text
Aggiorna PROFILE_BASICS come descritto in C:\Users\danie\workspace\Opex\Opex-main\auth\keycloakify\ONBOARDING_ROADMAP.md in modo che gli utenti Google non reinseriscano firstName e lastName se Keycloak li ha gia, ma debbano comunque completare birthDate se manca.
```

### Prompt D: Implement COUNTRY_SELECTION

```text
Implementa il required action custom COUNTRY_SELECTION descritto in C:\Users\danie\workspace\Opex\Opex-main\auth\keycloakify\ONBOARDING_ROADMAP.md. Deve mostrare i 4 paesi localizzati nel tema, salvare il valore ISO in Keycloak e integrarsi con il flow locale.
```

### Prompt E: Implement OCCUPATION

```text
Implementa il required action custom OCCUPATION descritto in C:\Users\danie\workspace\Opex\Opex-main\auth\keycloakify\ONBOARDING_ROADMAP.md. Deve raccogliere un testo libero obbligatorio con max 100 caratteri, salvarlo in Keycloak e integrarsi col tema e col flow locale.
```

### Prompt F: Implement LEGAL_ACCEPTANCE

```text
Implementa il required action custom LEGAL_ACCEPTANCE descritto in C:\Users\danie\workspace\Opex\Opex-main\auth\keycloakify\ONBOARDING_ROADMAP.md. Deve usare i tre documenti pubblici gia esistenti (/legal/privacy, /legal/terms, /legal/cookies), richiedere Terms e Privacy in modo obbligatorio, gestire i cookies come scelta opzionale con ramo reject non-essential -> acknowledge strictly necessary, e salvare i dati in modo compatibile con il modello legale gia presente nel backend Opex.
```

### Prompt G: Add token mappers

```text
Aggiungi i protocol mappers necessari nel setup locale di Keycloak per esporre nei token birthDate, country, occupation e legalAccepted, come descritto in C:\Users\danie\workspace\Opex\Opex-main\auth\keycloakify\ONBOARDING_ROADMAP.md.
```

### Prompt H: Sync backend Opex

```text
Aggiorna il backend Opex per sincronizzare da Keycloak firstName, lastName, birthDate, country, occupation e stato legale, seguendo la specifica in C:\Users\danie\workspace\Opex\Opex-main\auth\keycloakify\ONBOARDING_ROADMAP.md. Keycloak deve restare la fonte primaria e l'app solo una copia.
```

### Prompt I: Remove duplicated Opex onboarding

```text
Ora che l'onboarding e gestito in Keycloak, rimuovi o bypassa il vecchio onboarding duplicato nell'app Opex, sia lato frontend che lato backend, senza rompere login, sync utente e schermate principali.
```

### Prompt L: End-to-end review

```text
Fai una review end-to-end dell'onboarding Keycloak locale completo. Controlla tema, security choice opzionale, required actions, token mappers, sync backend Opex e rimozione del vecchio onboarding. Priorita assoluta a bug, regressioni e gap funzionali.
```
