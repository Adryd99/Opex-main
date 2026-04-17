# opex-web

Frontend module for Opex.

## Commands

```powershell
npm install
npm.cmd run dev -- --host 0.0.0.0
npm.cmd run lint
npm.cmd run build
```

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

## Ownership

- `app`: shell and top-level orchestration
- `features`: user-facing feature code
- `services`: API and auth integrations
- `shared`: small cross-feature primitives only

Keep feature-specific helpers inside the owning feature whenever possible.
