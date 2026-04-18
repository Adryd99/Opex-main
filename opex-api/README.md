# opex-api

Questo modulo contiene il backend Spring Boot di Opex.

La regola guida e semplice:

- la struttura root resta **feature-first**
- `common` contiene solo infrastruttura condivisa
- il backend non deve crescere per "layer globali" aggiunti a caso

## Scopo del modulo

`opex-api` espone le API usate dal frontend Opex e orchestra:

- profilo utente e sync con Keycloak
- banking e integrazione Salt Edge
- documenti legali e consensi
- dashboard e scadenze fiscali
- notifiche utente

## Mappa del modulo

### Root packages

```text
com.opex.backend
|-- banking/
|-- common/
|-- legal/
|-- notification/
|-- tax/
`-- user/
```

### Ownership per feature

- `banking`
  - conti bancari, connessioni, transazioni, analytics bancarie e integrazione Salt Edge
- `user`
  - profilo locale, sync con Keycloak, verify email e metadati onboarding
- `legal`
  - documenti pubblici, consensi obbligatori, open banking consent, export dati
- `tax`
  - dashboard fiscale, scadenze, calendar export, stime e regole fiscali
- `notification`
  - notifiche utente, scheduler e trigger applicativi
- `common`
  - configurazione e infrastruttura condivisa, non business logic di feature

## Struttura interna delle feature

Oggi ogni feature usa principalmente queste cartelle:

- `controller`
- `dto`
- `model`
- `repository`
- `service`

Alcune feature hanno anche sottosezioni specifiche, per esempio:

- `banking/saltedge`
- `legal/config`
- `common/security`
- `common/web`

Questa struttura di base va mantenuta.
Se in futuro una feature diventa piu ricca, la direzione corretta e:

- tenere la feature come root
- introdurre sottosezioni piu esplicite dentro la feature

Non e corretto aggiungere nuovi bucket globali al root tipo:

- `controllers`
- `services`
- `repositories`
- `utils`

## Regole per `common`

`common` non deve diventare una discarica.

Dentro `common` vanno solo elementi davvero trasversali, per esempio:

- security
- web mvc infrastructure
- exception handling condiviso
- config condivisa
- gateway o client condivisi a piu feature
- storage condiviso

Dentro `common` non devono finire:

- DTO specifici di una feature
- regole business di `tax`, `banking`, `user`, `legal`, `notification`
- orchestrazioni che appartengono a un caso d'uso funzionale
- helper generici senza ownership chiara

Se una classe serve davvero a una sola feature, resta nella feature.

## Regole per il wiring tra feature

Il backend oggi usa alcuni collegamenti tra feature, ma vanno tenuti espliciti.

Regole pratiche:

- i controller devono restare sottili
- quando una logica attraversa piu feature, preferire un service applicativo chiaro invece di orchestrare tutto nel controller
- evitare dipendenze cicliche implicite
- evitare che una feature conosca i dettagli interni di tutte le altre

Esempio corretto:

- `banking` puo collaborare con `legal` o `notification`
- ma questa collaborazione deve essere leggibile e motivata da un caso d'uso concreto

## Source of truth

### Sorgente vero

- [src/main/java](C:/Users/danie/workspace/Opex/Opex-main/opex-api/src/main/java)
- [src/main/resources](C:/Users/danie/workspace/Opex/Opex-main/opex-api/src/main/resources)
- [src/test/java](C:/Users/danie/workspace/Opex/Opex-main/opex-api/src/test/java)
- [pom.xml](C:/Users/danie/workspace/Opex/Opex-main/opex-api/pom.xml)
- [README.md](C:/Users/danie/workspace/Opex/Opex-main/opex-api/README.md)

### Artefatti generati o locali

- `target/`
- `logs/`
- `spring-boot-run.log`

Questi non sono sorgente.
Possono essere rigenerati o eliminati.

## Configurazione

La configurazione runtime vive principalmente in:

- [application.properties](C:/Users/danie/workspace/Opex/Opex-main/opex-api/src/main/resources/application.properties)

Il modulo supporta anche import locale da `.env` tramite:

- `spring.config.import=optional:file:../.env[.properties],optional:file:.env[.properties]`

Pattern da seguire:

- usare `@ConfigurationProperties` quando un blocco di config cresce
- evitare di spargere chiavi e default in piu punti diversi

## Comandi principali

### Setup locale consigliato

1. copia [../.env.example](C:/Users/danie/workspace/Opex/Opex-main/.env.example) in `../.env`
2. alza l'infrastruttura locale con `docker compose up -d`
3. avvia il backend con `.\mvnw.cmd spring-boot:run`

### Avvio locale

```powershell
.\mvnw.cmd spring-boot:run
```

### Compile veloce

```powershell
.\mvnw.cmd -q -DskipTests compile
```

### Test

```powershell
.\mvnw.cmd test
```

### Package

```powershell
.\mvnw.cmd package
```

## Convenzioni di refactor

Quando si rifattorizza `opex-api`, l'ordine corretto e questo:

1. chiarire il contratto HTTP
2. spezzare i service troppo grandi
3. introdurre componenti con responsabilita nette
4. solo dopo, valutare spostamenti di package

Non e utile spostare file solo per sembrare piu ordinati.
La priorita e separare responsabilita vere.
