# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # dev server with hot-reload (ts-node + nodemon, no compile needed)
npm run build     # compile TypeScript → dist/
npm start         # run compiled output (requires build first)
```

No test runner is configured yet (`npm test` exits with an error). Tests live in `tests/unit/`, `tests/integration/`, `tests/fixtures/` but are empty.

## Architecture

Hexagonal architecture (ports & adapters). Dependency rule: **outer layers import inner layers, never the reverse.**

```
src/
├── domain/          # Pure business entities — no framework imports allowed
├── applications/    # Use cases (FirewallService) + port interfaces (IFirewallService, IFirewallRepository)
├── adapters/
│   ├── input/
│   │   ├── controller/   # FirewallController — thin: validates request, calls service, formats response
│   │   └── http/         # FirewallRouter — mounts the 6 REST endpoints on an Express Router
│   └── output/
│       └── persistence/
│           ├── inMemory/  # InMemoryFirewallRepository (active implementation)
│           └── postgres/  # placeholder, not implemented
└── main/            # Wiring only: app.ts constructs instances and registers middleware; index.ts starts the server
```

> **Pending renames to match spec:** `applications/` → `application/`, `adapters/input/` → `adapters/inbound/`, `adapters/output/` → `adapters/outbound/`

### Key boundaries

- `domain/` and `applications/` must never import from `adapters/`, `main/`, or any framework (Express, DB drivers).
- `adapters/` may import from `applications/` and `domain/`, never from `main/`.
- `main/` is the only place that knows about both concrete adapters and use cases simultaneously.
- Controllers must stay thin: input validation + service call + response formatting only. No business logic.

### Domain model (`domain/FirewallRule.ts`)

`FirewallRule` has: `id` (auto-incremented), `value` (string | number), `type` (`'ip' | 'domain' | 'port'`), `mode` (`'blacklist' | 'whitelist'`), `active` (boolean).

### API surface (6 endpoints)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/firewall/ips` | Add IPv4 rules |
| `POST` | `/api/firewall/domains` | Add domain rules |
| `POST` | `/api/firewall/ports` | Add port rules |
| `DELETE` | `/api/firewall/rules` | Remove rules by `ids[]` |
| `GET` | `/api/firewall/rules` | Get all rules, optional `?type=ip\|domain\|port` |
| `PATCH` | `/api/firewall/rules/status` | Update `active` flag by `ids[]` |

## Conventions

- `camelCase` for variables/functions, `PascalCase` for classes and interfaces.
- One class/interface per file.
- `strict` mode is on in `tsconfig.json` — do not weaken it.
- Commit messages: short imperative line (e.g. `Add domain validation`). Branch per feature: `feature/<short-description>`. Never commit directly to `master`.

## Before doing these, ask first

- Changing `tsconfig.json` compiler options.
- Adding new runtime dependencies.
- Renaming the three folders listed under "Pending renames" (imports must all update together).
