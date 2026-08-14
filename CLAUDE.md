# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # dev server with hot-reload (tsx watch, no compile needed)
npm run build     # compile TypeScript → dist/
npm start         # run compiled output (requires build first)
npm test          # run unit tests (node:test via tsx)
```

`tsx` runs TypeScript directly. Do not reintroduce `ts-node` — it is incompatible with the
installed `typescript` v7 (the Go rewrite) and crashes on load.

## Architecture

Hexagonal architecture (ports & adapters). Dependency rule: **outer layers import inner layers, never the reverse.**

```
src/
├── domain/          # Pure business entities — no framework imports allowed
│   └── rules/       # Rule base class + registry, one subclass per rule type,
│                    # branded value types with their validation, InvalidRuleValueError
├── application/
│   ├── ports/       # RuleRepository — what the app needs from the outside world
│   └── useCases/    # addRules — orchestration, depends only on ports
├── adapters/
│   ├── input/
│   │   ├── controller/   # FirewallController — thin: reads body, calls use case, formats response
│   │   └── http/         # Router, shape-validation middleware, central error handler
│   └── output/
│       └── persistence/
│           ├── inMemory/  # InMemoryRuleRepository (active implementation)
│           └── postgres/  # placeholder, not implemented
└── main/            # Wiring only: app.ts constructs instances and registers middleware;
                     # index.ts starts the server
```

### Key boundaries

- `domain/` and `application/` must never import from `adapters/`, `main/`, or any framework (Express, DB drivers).
- `adapters/` may import from `application/` and `domain/`, never from `main/`.
- `main/` is the only place that knows about both concrete adapters and use cases simultaneously.
- Controllers stay thin: read the already-shape-validated body, call the use case, format the response. No business logic, and **no try/catch** — thrown errors are handled centrally.

### Where validation lives

Two distinct concerns, deliberately kept apart:

- **Request shape** (`adapters/input/http/Validation.ts`) — is `values` a non-empty array? is `mode` one of the two allowed strings? Type-agnostic, so every add-endpoint reuses `validateAddRule` unchanged.
- **Business rules** (`domain/rules/*Type.ts`) — is this a real IPv4 / bare domain / port in range? Throws `InvalidRuleValueError` with a `code` (`INVALID_IP`, `INVALID_DOMAIN`, `INVALID_PORT`).

`ErrorHandler.ts` maps both to the spec's error response. Adding an error case means throwing a typed error, not writing status-code logic in a controller.

### Domain model

`Rule` is an abstract base class with a static registry. Each subclass calls `Rule.register(type, ctor)`
at module load, and `Rule.build(type, rawValue)` dispatches to the right one. Registration is an
**import side effect**, so every subclass must be listed in `domain/rules/index.ts` — importing `Rule`
from anywhere else risks an empty registry.

A rule carries `value` (branded string), `type` (`'ip' | 'domain' | 'port'`), and `active` (defaults to `true`).
`id` and `mode` (`'blacklist' | 'whitelist'`) belong to storage, not the entity — the repository assigns
a single shared id sequence across all types and modes.

### Adding a new rule type

1. Add a branded value type + `createX`/`isValidX` in `domain/rules/xType.ts` (throw `InvalidRuleValueError`).
2. Add `XRule extends Rule` with a static `create`, ending in `Rule.register('x', XRule)`.
3. List it in `domain/rules/index.ts` — otherwise `Rule.build('x', …)` throws "No Rule class registered".
4. Add a controller method calling `addRules(this.repository, 'x', values, mode)`.
5. Add one router line with the existing `validateAddRule` middleware.

No changes to the use case, validation, repository, or error handler.

### API surface

| Method | Path | Status |
|---|---|---|
| `POST` | `/api/firewall/ips` | implemented |
| `POST` | `/api/firewall/domains` | not implemented |
| `POST` | `/api/firewall/ports` | not implemented |
| `DELETE` | `/api/firewall/rules` | not implemented |
| `GET` | `/api/firewall/rules` | not implemented |
| `PATCH` | `/api/firewall/rules/status` | not implemented |

## Conventions

- `camelCase` for variables/functions, `PascalCase` for classes and interfaces.
- One class/interface per file; the filename matches the class.
- `strict` mode is on in `tsconfig.json` — do not weaken it.
- Prefer explicit types over `any`.

## Git / GitHub Flow

- `master` is always deployable. Never commit directly to it.
- One feature branch per unit of work: `feature/<short-description>`.
- Commit messages: short imperative summary line (e.g. `Add domain validation`).
- Open a Pull Request into `master` when ready; do not force-push shared branches without flagging it first.

## Before doing these, ask first

- Changing `tsconfig.json` compiler options.
- Adding or changing dependencies.
- Changing the default branch or repository settings.
