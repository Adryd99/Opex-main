# opex-web

Frontend module for Opex.

This module is responsible for:

- application shell and authenticated workspace flow
- Keycloak browser authentication
- API integration with `opex-api`
- user-facing feature pages such as banking, dashboard, settings and taxes

The goal of this module is not to be "smart everywhere". The code should stay readable by keeping responsibilities close to the feature that owns them.

## Commands

```powershell
npm install
Copy-Item .\.env.example .\.env
npm.cmd run dev -- --host 0.0.0.0
npm.cmd run lint
npm.cmd run build
npm.cmd run test
```

`opex-web/.env` is optional. If it is missing, the frontend still works with the local defaults already defined in:

- `src/services/api/opex/http.ts`
- `src/services/auth/keycloak/config.ts`

The local root `.env` is **not** used by Vite. The frontend reads local overrides only from:

- `opex-web/.env`
- standard Vite mode env files such as `opex-web/.env.local`

## Local URL

- [http://localhost:3000](http://localhost:3000)

## Source Layout

```text
src/
|-- app/
|-- features/
|-- services/
`-- shared/
```

## Ownership Rules

### `src/app`

Use `app` for:

- top-level shell
- authenticated app boot
- high-level navigation state
- feature wiring
- layout primitives that belong to the whole workspace shell

Do not put feature-specific business rules here unless the logic is truly cross-feature and shell-driven.

### `src/features`

Use `features/<feature>` for:

- pages
- feature-specific components
- feature-local helpers
- feature-local types when they are not shared broadly
- UI state that belongs to one feature

Default rule: if only one feature needs it, it should live inside that feature.

### `src/services`

Use `services` for:

- auth integration
- runtime environment access
- HTTP helpers
- API clients
- transport-layer normalizers

`services` should not become a second feature layer. Domain-heavy fallback content or UI-oriented helpers should stay closer to the owning feature.

### `src/shared`

Use `shared` only for small, stable primitives that are truly reused across features:

- design-system style UI primitives
- very small formatting helpers
- types that are genuinely cross-feature

Do not put feature logic in `shared` just because it is imported twice.

## Current Architectural Direction

The intended direction of the module is:

- `app` = shell and composition
- `features` = product behavior and UI by area
- `services` = integration boundaries
- `shared` = thin reusable primitives

This means:

- avoid turning `app` into a mega-feature
- avoid turning `shared` into a dumping ground
- prefer local clarity over abstract layering

## Source Of Truth

For runtime behavior:

- feature UI and feature behavior live in `src/features`
- shell flow lives in `src/app`
- auth and API integration live in `src/services`

For generated output:

- `dist/` is build output
- `node_modules/` is dependency output

These generated directories are not source and should never be edited manually.

## Source vs Generated Files

Source:

- `src/**`
- `index.html`
- `vite.config.ts`
- `eslint.config.js`
- `Dockerfile`
- `nginx.conf`

Generated or local-only:

- `dist/`
- `dist-ssr/`
- `node_modules/`
- `logs/`
- local `.env` files such as `opex-web/.env`

## Refactor Rules

When refactoring this module:

1. Do not change UX or behavior unless the refactor explicitly requires it.
2. Prefer small structural steps over broad rewrites.
3. Extract only when the new boundary represents a real responsibility.
4. Keep feature-specific helpers inside the owning feature whenever possible.
5. Remove legacy paths only after the replacement path is already confirmed.
6. If a file grows because it owns a rich UI, that is acceptable; split only when responsibilities are mixed.

## Current Known Refactor Themes

These are the areas that should be watched during the cleanup work:

- `src/app/App.tsx` is still too central
- `src/app/layout/index.tsx` still groups too many shell components
- `src/features/settings` is the densest feature
- `src/features/taxes/pages/TaxesPage.tsx` is still page-heavy
- `src/shared/types.ts` is too broad
- `src/services/api/opex/http.ts` still deserves continued attention as the API error contract evolves
- there is now a minimal Vitest base, but test coverage is still intentionally selective

These themes are tracked in the temporary refactor plan and should be addressed step by step instead of all at once.
