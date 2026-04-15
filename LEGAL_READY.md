# Legal Readiness Baseline

This repository now includes a technical legal-readiness baseline for:

- versioned privacy notice, terms of service, cookie/storage notice, and open-banking notice
- GDPR consent capture with acceptance timestamps and accepted document versions
- privacy center actions for data export and account deletion
- public legal document pages reachable without authentication
- open-banking consent gating before redirecting a user to Salt Edge
- data export endpoint for access/portability workflows
- environment-based legal and secret configuration

## Configure Before Production

Set these values in the runtime environment before go-live:

- `LEGAL_CONTROLLER_NAME`
- `LEGAL_CONTROLLER_ADDRESS`
- `LEGAL_PRIVACY_EMAIL`
- `LEGAL_DPO_EMAIL`
- `LEGAL_SUPPORT_EMAIL`
- `LEGAL_SUPERVISORY_AUTHORITY`
- `LEGAL_POLICY_LAST_UPDATED`
- `LEGAL_PRIVACY_VERSION`
- `LEGAL_TERMS_VERSION`
- `LEGAL_COOKIE_VERSION`
- `LEGAL_OPEN_BANKING_VERSION`
- `LEGAL_RETENTION_ACTIVE_ACCOUNT`
- `LEGAL_RETENTION_CLOSED_ACCOUNT`
- `LEGAL_RETENTION_OPEN_BANKING`
- `LEGAL_RETENTION_CONSENT_AUDIT`

Also set infrastructure secrets via environment variables:

- `APP_PG_JDBC_URL`
- `APP_PG_USER`
- `APP_PG_PASSWORD`
- `KEYCLOAK_ISSUER_URI`
- `KEYCLOAK_SERVER_URL`
- `KEYCLOAK_ADMIN_REALM`
- `KEYCLOAK_ADMIN_CLIENT_ID`
- `KC_ADMIN`
- `KC_ADMIN_PW`
- `KEYCLOAK_TARGET_REALM`
- `SALTEDGE_PROXY_URL`
- `SALTEDGE_APP_ID`
- `SALTEDGE_SECRET`
- `AWS_S3_BUCKET_NAME`
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

## Still Required Outside Code

The code changes do not replace legal or operational work. Before production, confirm:

- the controller identity and contact details are real and legally reviewed
- your privacy notice reflects the actual hosting, subprocessors, transfers, and retention schedule
- Salt Edge and any cloud vendors are covered by signed processor agreements where required
- the team has a DSAR process for access, erasure, rectification, portability, and objection requests
- incident handling and breach-notification workflows are documented
- tax/accounting retention periods are reviewed by counsel or an accountant for the target jurisdictions
- the final terms of service are reviewed for governing law, limitation clauses, and consumer/business model fit

## Verification

- Frontend type-check: `npm.cmd run lint`
- Java modules need a JDK in the environment to compile and run tests
