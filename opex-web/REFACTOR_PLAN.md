# Opex Web Refactor Plan

## Scopo

Questo file e temporaneo. Serve a guidare un refactor strutturale di `opex-web` senza cambiare il comportamento utente piu del necessario.

L'obiettivo non e "riscrivere il frontend", ma:

- rendere il codice piu leggibile
- ridurre i file-orchestratori troppo densi
- separare meglio shell app, feature, servizi API e tipi
- eliminare duplicazioni o percorsi legacy che oggi creano rumore
- preparare il codice a test piu credibili

Quando il refactor sara finito e consolidato, questo file verra cancellato.

---

## Stato attuale

## Cosa e gia buono

- La root structure e gia chiara:
  - `src/app`
  - `src/features`
  - `src/services`
  - `src/shared`
- Le feature principali sono gia separate in cartelle leggibili:
  - `banking`
  - `dashboard`
  - `settings`
  - `taxes`
  - `legal`
  - `budget`
  - `onboarding`
- Il layer API e gia abbastanza ordinato:
  - `services/api/opex/clients`
  - `services/api/opex/normalizers`
  - `services/api/opex/types`
- Il wrapper API pubblico e sottile:
  - `src/services/api/opexApi.ts`

Quindi la base non e da buttare. Il problema vero non e la root structure, ma alcuni punti di densita e accentramento.

## Hotspot reali osservati

### 1. `app` contiene ancora troppa orchestrazione

File principali:

- `src/app/App.tsx`
- `src/app/layout/index.tsx`
- `src/app/useAppController.ts`
- `src/app/controller/useAppData.ts`
- `src/app/controller/useBankingFlow.ts`
- `src/app/controller/useProfileActions.ts`

Problemi osservati:

- `App.tsx` fa insieme:
  - auth gating
  - route-like switching
  - tab state
  - page composition
  - settings wiring
  - mobile navigation
  - success redirect flow per banking
- `layout/index.tsx` contiene troppi componenti diversi nello stesso file:
  - sidebar
  - top bar
  - quick actions
  - notification UI
  - account selector
  - subpage shell
  - centered status card
- La navigazione e basata su stringhe sparse (`'SETTINGS_*'`, `'QUICK_*'`, `'[]'`, ecc.), quindi oggi e facile introdurre drift o regressioni.

### 2. `settings` e la feature piu densa e piu esposta a duplicazioni

File principali:

- `src/features/settings/pages/SettingsPage.tsx`
- `src/features/settings/components/SettingsProfileSection.tsx`
- `src/features/settings/components/ProfileEditorForm.tsx`
- `src/features/settings/pages/EditProfilePage.tsx`

Problemi osservati:

- `SettingsPage.tsx` contiene insieme:
  - section registry
  - profile completion logic
  - verification email cooldown UI
  - theme handling
  - section rendering switch
- Esiste ancora un percorso legacy:
  - `EditProfilePage.tsx`
  anche se il profilo oggi si modifica inline dentro `SettingsProfileSection`.
- Alcune logiche di dominio sono duplicate o troppo vicine ai componenti:
  - `isAdultBirthDate`
  - formatting cooldown
  - checklist completion logic
- La feature e gia funzionale, ma la struttura interna si sta appesantendo.

### 3. `taxes` e `banking` hanno ancora pagine troppo dense

File principali:

- `src/features/taxes/pages/TaxesPage.tsx`
- `src/features/taxes/components/TaxProfileSetupDialog.tsx`
- `src/features/banking/pages/AddBankPage.tsx`
- `src/features/banking/pages/AccountSetupPage.tsx`
- `src/features/banking/components/BankConnectionDetailView.tsx`

Problemi osservati:

- `TaxesPage.tsx` mescola:
  - page shell
  - formatting
  - fallback shaping
  - summary blocks
  - compliance calendar
  - tax setup side panel
- `banking` e abbastanza ben separata a livello directory, ma parte dell'orchestrazione vera sta ancora in `useBankingFlow`, quindi il confine tra feature UI e coordinamento applicativo non e ancora perfetto.

### 4. `shared/types.ts` e diventato troppo largo

File principale:

- `src/shared/types.ts`

Problemi osservati:

- Mescola tipi di:
  - user
  - legal
  - banking
  - dashboard
  - forecast
  - tax buffer
- Oggi funziona, ma non scala bene.
- Ogni feature dipende facilmente da un file unico molto grosso.

### 5. `services/api/legalFallbacks.ts` e importante, ma nel posto sbagliato

File principale:

- `src/services/api/legalFallbacks.ts`

Problemi osservati:

- E un file molto grosso con contenuto quasi documentale e fallback di dominio.
- Non e propriamente "trasporto API".
- Mescola:
  - contenuto fallback
  - storage locale consensi
  - sync locale dei consensi

Questo suggerisce un refactor verso una responsabilita piu chiara, probabilmente lato `features/legal` o `shared/legal`.

### 6. Mancano test reali

Osservazione:

- Nel modulo oggi non risultano test `*.test.ts(x)` o `*.spec.ts(x)`.

Questo non blocca il refactor, ma significa che i primi step devono essere strutturali e conservativi. Prima spezzare bene, poi aggiungere copertura dove il refactor espone confini naturali.

### 7. Alcuni dettagli tecnici meritano un consolidamento

Punti emersi:

- `src/app/main.tsx` usa un pattern con `window.__root` utile in dev, ma poco elegante come punto di ingresso definitivo.
- `vite.config.ts` contiene define per `GEMINI_API_KEY` che oggi non sembrano parte chiara dell'architettura del modulo.
- `services/api/opex/http.ts` ha un contratto errore ancora minimale: oggi l'errore diventa quasi sempre `Error(message string)`.

Questi non sono i primi target, ma vanno tenuti nel radar.

---

## Direzione architetturale consigliata

Il refactor non deve spostare tutto in layer astratti o introdurre pattern pesanti.

La direzione giusta e questa:

- `app`:
  - solo shell, routing/state di alto livello, wiring
- `features/<feature>`:
  - UI, page sections, helpers locali della feature, eventuali hook locali
- `services`:
  - auth, HTTP, API clients, normalizers, env runtime
- `shared`:
  - primitive UI, tipi veramente cross-feature, utility piccole e stabili

In particolare:

- evitare che `app` diventi una "mega feature"
- evitare che `shared` diventi un contenitore generico senza confini
- spostare la logica di feature il piu vicino possibile alla feature stessa

---

## Regole del refactor

Durante il refactor seguire queste regole:

1. Non cambiare UX o flow se non e strettamente necessario.
2. Evitare mega-rinomine inutili.
3. Fare step piccoli e verificabili.
4. Preferire estrazioni che chiariscono una responsabilita reale.
5. Non creare package/cartelle "future-proof" senza uso immediato.
6. Rimuovere il codice legacy solo quando il percorso nuovo e gia confermato.

---

## Piano a step

## Step 0 - Preparazione e regole

### Status

Completed.

### Obiettivo

Chiarire responsabilita del modulo e fissare le regole del refactor.

### Cosa fare

- migliorare `README.md` del modulo
- documentare:
  - struttura
  - ownership per cartelle
  - cosa puo stare in `shared`
  - cosa deve stare in `features`
  - cosa e legacy e cosa no
- allineare `.gitignore` se necessario

### Uscita attesa

Chi entra nel modulo capisce subito dove mettere codice nuovo e dove non metterlo.

### Note di completamento

- `README.md` aggiornato con:
  - responsabilita del modulo
  - ownership chiara di `app`, `features`, `services`, `shared`
  - source of truth
  - distinzione sorgente vs artefatti generati
  - regole di refactor del frontend
- `.gitignore` aggiornato per coprire:
  - env locali futuri
  - coverage
  - `*.tsbuildinfo`

---

## Step 1 - Stabilizzare shell app e modello di navigazione

### Status

Completed.

### Obiettivo

Ridurre il peso di `App.tsx` e togliere stringhe-tab sparse come centro dell'architettura.

### Cosa fare

- introdurre un modello tipizzato per la navigazione app
  - tab principali
  - subpage
  - settings routes
  - quick actions
- spostare costanti e resolver di navigazione fuori da `App.tsx`
- rendere `App.tsx` soprattutto un compositore

### File coinvolti

- `src/app/App.tsx`
- `src/app/controller/useAppNavigation.ts`
- eventuale nuovo:
  - `src/app/navigation/*`

### Uscita attesa

`App.tsx` piu corto, meno stringhe magiche, meno switch fragili.

### Note di completamento

- Introdotto un modulo dedicato:
  - `src/app/navigation/index.ts`
- Centralizzati in quel modulo:
  - tab principali
  - subpage
  - alias legacy
  - resolver per settings navigation
  - page title helpers
  - selector per mobile shell
- `useAppNavigation.ts` ora normalizza gli alias legacy e mantiene lo stato tab su un modello centralizzato.
- `App.tsx` non contiene piu:
  - costanti di navigazione locali
  - resolver inline per settings tab
  - logica locale per page title e subpage detection
- Alias legacy come `OPEN_BANKING`, `ADD_BANK` e `SETTINGS_ADD_BANK` vengono normalizzati verso il target canonico invece di essere gestiti con rami separati nello switch.
- A supporto della stabilizzazione del modulo:
  - rimosso un import inutilizzato in `app/layout/index.tsx`
  - aggiunto `src/vite-env.d.ts` per dichiarare gli asset `.png`
- Verifica completata con:
  - `npm.cmd run lint`
  - `npm.cmd run build`

---

## Step 2 - Spezzare `app/layout`

### Status

Completed.

### Obiettivo

Separare i componenti della shell che oggi convivono in `layout/index.tsx`.

### Cosa fare

Estrarre in file dedicati:

- `Sidebar`
- `TopBar`
- `QuickActions`
- `AccountSelector`
- `NotificationButton`
- `SubpageShell`
- `CenteredStatusCard`

### File coinvolti

- `src/app/layout/index.tsx`
- nuova cartella proposta:
  - `src/app/layout/components/*`

### Uscita attesa

Un file barrel piccolo e componenti shell leggibili uno per uno.

### Note di completamento

- Estratti i componenti shell in file dedicati sotto:
  - `src/app/layout/components/AccountSelector.tsx`
  - `src/app/layout/components/NotificationButton.tsx`
  - `src/app/layout/components/QuickActions.tsx`
  - `src/app/layout/components/SubpageShell.tsx`
  - `src/app/layout/components/Sidebar.tsx`
  - `src/app/layout/components/TopBar.tsx`
  - `src/app/layout/components/CenteredStatusCard.tsx`
- Creato un supporto condiviso per costanti e helper del layout:
  - `src/app/layout/support.ts`
- `src/app/layout/index.tsx` e ora un barrel minimale che re-exporta i componenti pubblici.
- Nessun import pubblico delle feature ha dovuto cambiare, quindi il confine del modulo `layout` e rimasto stabile.
- La `Sidebar` usa ora anche gli helper di navigation introdotti nello Step 1 invece di duplicare la logica di tab attive.
- Verifica completata con:
  - `npm.cmd run lint`
  - `npm.cmd run build`

---

## Step 3 - Ripulire il controller applicativo

### Status

Completed.

### Obiettivo

Rendere piu leggibile il confine tra:

- data loading
- banking flow
- profile actions
- app shell state

### Cosa fare

- mantenere `useAppController` come facciata
- spezzare ulteriormente solo dove c'e una responsabilita netta
- spostare helper e costanti correlate vicino ai rispettivi hook
- rivedere se alcuni eventi `window`/`localStorage` possono essere centralizzati meglio

### File coinvolti

- `src/app/useAppController.ts`
- `src/app/controller/useAppData.ts`
- `src/app/controller/useBankingFlow.ts`
- `src/app/controller/useProfileActions.ts`
- `src/app/controller/controllerSupport.ts`

### Uscita attesa

Hook piu piccoli e responsabilita meglio allineate.

### Note di completamento

- Estratti moduli dedicati per responsabilita nette del controller applicativo:
  - `src/app/controller/defaults.ts`
  - `src/app/controller/errors.ts`
  - `src/app/controller/providerSupport.ts`
  - `src/app/controller/providerSelection.ts`
  - `src/app/controller/timeAggregation.ts`
  - `src/app/controller/dashboardDerivations.ts`
- `useAppData.ts` non contiene piu:
  - gestione locale dello stato provider selezionato
  - pubblicazione del registry provider in `localStorage`
  - derivazioni dashboard e time aggregation inline
- `useBankingFlow.ts` e `useProfileActions.ts` dipendono ora da moduli piu mirati invece che da un helper generico troppo largo.
- `controllerSupport.ts` e stato ridotto a barrel di compatibilita, mentre la logica vera vive nei moduli specializzati del controller.
- `src/app/useAppController.ts` e rimasto una facciata stabile: la superficie pubblica del controller applicativo non e cambiata.
- Verifica completata con:
  - `npm.cmd run lint`
  - `npm.cmd run build`

---

## Step 4 - Consolidare `settings`

### Status

Completed.

### Obiettivo

Ridurre densita e duplicazioni nella feature piu grossa.

### Cosa fare

- spezzare `SettingsPage.tsx` in:
  - section registry/config
  - profile completion support
  - email verification state/cooldown hook
- tenere `SettingsProfileSection` focalizzata sul rendering
- valutare rimozione del percorso legacy `EditProfilePage.tsx` se non serve piu
- spostare formatter e validator riusabili fuori dai componenti grossi

### File coinvolti

- `src/features/settings/pages/SettingsPage.tsx`
- `src/features/settings/components/SettingsProfileSection.tsx`
- `src/features/settings/components/ProfileEditorForm.tsx`
- `src/features/settings/pages/EditProfilePage.tsx`
- `src/features/settings/utils.ts`

### Uscita attesa

Feature `settings` ancora ricca, ma non piu centrata su 2-3 file troppo densi.

### Note di completamento

- Estratti supporti e hook locali per la logica piu densa di `SettingsPage`:
  - `src/features/settings/support/profileCompletion.ts`
  - `src/features/settings/support/configurationStatus.ts`
  - `src/features/settings/support/sections.ts`
  - `src/features/settings/hooks/useEmailVerificationState.ts`
- `SettingsPage.tsx` non contiene piu:
  - sezione registry inline
  - checklist/completion logic inline
  - stato e countdown della verification email inline
- `ProfileEditorForm.tsx` riusa ora la stessa logica 18+ della feature invece di mantenere una copia locale separata.
- `SettingsProfileSection.tsx` e `SettingsPrivacySection.tsx` usano tipi condivisi della feature invece di ridefinire payload locali.
- Il percorso legacy `EditProfilePage.tsx` e stato rimosso:
  - non aveva piu callsite reali
  - il profilo si modifica solo inline dentro `SettingsProfileSection`
  - sono stati rimossi anche il relativo export e il tab legacy dall'app shell
- Corretti anche i copy corrotti nella privacy section.
- Verifica completata con:
  - `npm.cmd run lint`
  - `npm.cmd run build`

---

## Step 5 - Ripulire `taxes` e rifinire `banking`

### Status

Completed.

### Obiettivo

Spezzare le pagine piu dense e avvicinare la logica alla feature corretta.

### Cosa fare

- spezzare `TaxesPage.tsx` in sezioni leggibili:
  - summary
  - breakdown
  - liability split
  - compliance calendar
  - tax setup side panel
- verificare se parte della logica di `useBankingFlow` va avvicinata alla feature `banking`
- estrarre formatter/local support di `taxes`

### File coinvolti

- `src/features/taxes/pages/TaxesPage.tsx`
- `src/features/taxes/support.ts`
- `src/features/banking/*`
- `src/app/controller/useBankingFlow.ts`

### Uscita attesa

Pagine di feature piu facili da leggere e mantenere.

### Note di completamento

- `TaxesPage.tsx` e stata alleggerita:
  - formatter, fallback shaping e sorting sono stati spostati in `src/features/taxes/support.ts`
  - le sezioni UI sono state spezzate in componenti dedicati sotto `src/features/taxes/components/`
- Nuovi componenti taxes introdotti:
  - `TaxBufferSummaryCard.tsx`
  - `TaxBreakdownCard.tsx`
  - `TaxLiabilitySplitCard.tsx`
  - `TaxComplianceCalendarCard.tsx`
  - `TaxSidebarCards.tsx`
  - con barrel `src/features/taxes/components/index.ts`
- `AddBankPage.tsx` non concentra piu tutto lo stato locale e gli handler:
  - la logica di selezione connessione, edit account, remove connection e open-banking consent e stata estratta in `src/features/banking/hooks/useAddBankPageState.ts`
- Le view banking di lista e dettaglio connessione sono state ripulite e i copy corrotti sono stati normalizzati:
  - `src/features/banking/components/BankConnectionListView.tsx`
  - `src/features/banking/components/BankConnectionDetailView.tsx`
- Il confine pubblico delle feature non e cambiato:
  - `TaxesPage` e `AddBankPage` mantengono lo stesso ruolo nell'app shell
  - `useBankingFlow` resta il coordinatore applicativo introdotto negli step precedenti
- Verifica completata con:
  - `npm.cmd run lint`
  - `npm.cmd run build`

---

## Step 6 - Riordinare tipi e boundary API

### Status

Completed.

### Obiettivo

Ridurre il peso di `shared/types.ts` e chiarire cosa e dominio condiviso vs cosa e contratto API.

### Cosa fare

- dividere `shared/types.ts` per area:
  - `shared/types/user.ts`
  - `shared/types/banking.ts`
  - `shared/types/legal.ts`
  - `shared/types/tax.ts`
  - eventuale barrel `shared/types/index.ts`
- mantenere in `services/api/opex/types.ts` solo i payload HTTP veri
- rivedere i normalizer piu grossi per spezzare i casi d'uso

### File coinvolti

- `src/shared/types.ts`
- `src/services/api/opex/types.ts`
- `src/services/api/opex/normalizers/*`

### Uscita attesa

Meno coupling implicito tra feature e meno dipendenza da un mega-file centrale.

### Note di completamento

- `src/shared/types.ts` non e piu il contenitore unico di tutti i tipi cross-feature.
- I tipi condivisi sono stati separati per dominio sotto:
  - `src/shared/types/app.ts`
  - `src/shared/types/user.ts`
  - `src/shared/types/legal.ts`
  - `src/shared/types/banking.ts`
  - `src/shared/types/finance.ts`
  - `src/shared/types/tax.ts`
  - `src/shared/types/notifications.ts`
  - con barrel `src/shared/types/index.ts`
- `src/shared/types.ts` e stato mantenuto come barrel di compatibilita:
  - preserva gli import esistenti delle feature
  - evita churn inutile mentre la struttura interna diventa leggibile
- Il boundary API e stato reso piu esplicito:
  - `services/api/opex/normalizers/*`
  - `services/api/opex/clients/*`
  importano ora tipi di dominio specifici invece del mega-file centrale.
- `services/api/opex/types.ts` e rimasto intenzionalmente focalizzato sui payload HTTP veri:
  - patch user
  - payload banking/tax
  - query dashboard
  - risposta integrazione banking
  Non e stato spezzato artificialmente perche il suo perimetro era gia coerente.
- Verifica completata con:
  - `npm.cmd run lint`
  - `npm.cmd run build`

---

## Step 7 - Spostare e chiarire `legalFallbacks`

### Status

Completed.

### Obiettivo

Dare una casa piu chiara a contenuto legale fallback e storage locale dei consensi.

### Cosa fare

- separare:
  - contenuto fallback
  - sync consensi locali
  - persistenza locale consensi
- valutare spostamento da `services/api` a:
  - `features/legal/support`
  - oppure `shared/legal`

### File coinvolti

- `src/services/api/legalFallbacks.ts`
- `src/shared/legal/*`
- `src/features/legal/*`

### Uscita attesa

`services/api` resta focalizzato su integrazione remota, non su contenuti statici di dominio.

### Note di completamento

- `src/services/api/legalFallbacks.ts` e stato rimosso.
- Il contenuto e stato spostato e separato sotto `src/shared/legal/`:
  - `defaultPublicInfo.ts`
  - `localConsentStorage.ts`
  - con re-export dal barrel `src/shared/legal/index.ts`
- Il refactor ha separato davvero le responsabilita:
  - `DEFAULT_LEGAL_PUBLIC_INFO` vive ora come fallback di dominio condiviso
  - la persistenza locale dei consensi vive in `localConsentStorage.ts`
  - `services/api/opex/clients/legalClient.ts` continua a occuparsi solo del fallback di chiamata remota
- `app/App.tsx`, `useAppData.ts`, `useBankingFlow.ts` e `useProfileActions.ts` importano ora questi helper da `shared/legal` invece che da `services/api`.
- Il risultato e che `services/api` e tornato focalizzato su:
  - HTTP
  - client remoti
  - normalizzazione payload
  senza contenuti statici o storage locale di dominio.
- Verifica completata con:
  - `npm.cmd run lint`
  - `npm.cmd run build`

---

## Step 8 - Hardening tecnico e test minimi

### Status

Completed.

### Obiettivo

Chiudere il refactor con piu fiducia e meno regressioni silenziose.

### Cosa fare

- introdurre una base test per i punti piu importanti:
  - normalizers
  - profile completion logic
  - tax helpers
  - eventualmente auth helpers
- valutare introduzione di `vitest`
- rivedere:
  - `main.tsx`
  - `vite.config.ts`
  - gestione errori in `services/api/opex/http.ts`

### Uscita attesa

Frontend piu stabile e piu facile da far evolvere dopo il refactor.

### Note di completamento

- Introdotta una base test minima con Vitest:
  - script `npm.cmd run test`
  - configurazione `vitest.config.ts`
- Aggiunti test mirati su funzioni pure e boundary stabili:
  - `src/features/settings/support/profileCompletion.test.ts`
  - `src/features/taxes/support.test.ts`
  - `src/services/api/opex/normalizers/user.test.ts`
  - `src/services/api/opex/http.test.ts`
- `src/app/main.tsx` e stato ripulito:
  - rimossi i `@ts-ignore`
  - tipizzato il root riusato in dev
  - aggiunto controllo esplicito sul container `#root`
- `vite.config.ts` e stato semplificato:
  - rimossi i `define` legacy per `GEMINI_API_KEY`
  - mantenuta solo la configurazione reale usata dal modulo
- `src/services/api/opex/http.ts` e stato irrobustito:
  - introdotto `ApiHttpError`
  - migliorata l'estrazione dei messaggi errore da payload JSON o testuali
  - il contratto errore del layer HTTP e ora piu utile per i caller e per i test
- `README.md` aggiornato per includere il comando `npm.cmd run test`
- Verifica completata con:
  - `npm.cmd run lint`
  - `npm.cmd run test`
  - `npm.cmd run build`

---

## Ordine consigliato di esecuzione

Ordine pragmatico:

1. Step 0 - Preparazione e regole
2. Step 1 - Stabilizzare shell app e navigazione
3. Step 2 - Spezzare `app/layout`
4. Step 3 - Ripulire il controller applicativo
5. Step 4 - Consolidare `settings`
6. Step 5 - Ripulire `taxes` e rifinire `banking`
7. Step 6 - Riordinare tipi e boundary API
8. Step 7 - Spostare e chiarire `legalFallbacks`
9. Step 8 - Hardening tecnico e test minimi

---

## Cose da non fare subito

Per ora eviterei:

- introdurre router pesanti solo per "bellezza"
- cambiare completamente il modello auth
- rifare tutta la UI
- cambiare naming di tutte le feature in una volta
- spostare codice tra cartelle senza una responsabilita chiara

Il focus deve restare:

- leggibilita
- confini chiari
- rischio basso

---

## Sintesi finale

`opex-web` non e un frontend da rifare. La base e gia buona.

Il refactor serve soprattutto a correggere questi punti:

- `app` troppo centrale
- `layout` troppo denso
- `settings` troppo carico
- `taxes` e parte di `banking` ancora un po' monolitici
- `shared/types.ts` troppo largo
- `legalFallbacks.ts` nel posto sbagliato
- assenza di test minimi

Se il refactor segue gli step sopra, il modulo dovrebbe diventare molto piu pulito senza rompere il prodotto.
