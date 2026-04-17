# opex-api

Spring Boot API module for Opex.

## Commands

```powershell
.\mvnw.cmd spring-boot:run
.\mvnw.cmd test
```

## Package Layout

```text
com.opex.backend
|-- banking/
|-- common/
|-- legal/
|-- notification/
|-- tax/
`-- user/
```

## Ownership

- `common`: shared infrastructure only
- feature packages: domain controllers, services, models, repositories, and DTOs

Keep cross-feature wiring explicit. Avoid adding new root layer buckets.
