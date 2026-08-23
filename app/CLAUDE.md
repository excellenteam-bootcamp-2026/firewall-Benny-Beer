# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev             # dev server with hot-reload (tsx watch, no compile needed)
npm run build           # compile TypeScript → dist/
npm start               # run compiled output (requires build first)
npm test                # run the Jest suite — hits a real Postgres DB, seeded once via globalSetup
npm run test:coverage   # same, plus a coverage report (gated at 100% statements)
npm run db:seed         # populate the dev DB with mock data (scripts/mock_data_population.ts)
node --env-file-if-exists=.env.dev node_modules/jest/bin/jest.js tests/integration/ips.test.ts   # run a single test file
```

`npm run dev`/`db:seed` load `.env.dev`/`.env` via Node's `--env-file-if-exists` flag (not dotenv on the
app side — `drizzle.config.ts` is the one place that still uses the `dotenv` package, since drizzle-kit
runs outside these scripts). Copy `.env.example` to `.env` before running anything; `env.ts` (see below)
exits the process immediately if required variables are missing or malformed.

`tests/` mirrors `src/`'s layout under `tests/unit/**` (e.g. `tests/unit/domain/rules/IpRule.test.ts` tests
`src/domain/rules/IpRule.ts`, using `InMemoryRuleRepository` for use-case tests) plus `tests/integration/**`
(real Postgres + `supertest` against `src/main/app.ts`, one file per endpoint) and one
`tests/system/happyFlow.test.ts`. A Jest `globalSetup` (`tests/globalSetup.ts`) seeds ~60 mock rows via
`scripts/mock_data_population.ts`'s exported `populateMockData()` **once** before the whole run — tests do
**not** wipe the DB between each other, so assertions use `.find()`/`.some()`/length-delta checks (never
exact array equality on "all rules"), and tests that create rows use a reserved, collision-free value
range (see comments at the top of each `tests/integration/*.test.ts` file) plus `afterAll` cleanup. Jest
runs test files serially (`maxWorkers: 1` in `jest.config.ts`) since there's no per-test DB transaction
isolation against the shared instance.

`tsx` runs TypeScript directly (used by `dev`/`db:seed`); Jest tests are transformed by `@swc/jest`
(syntax-only, like `tsx`/esbuild). Do not reintroduce `ts-node` or `ts-jest` — both depend on the
`typescript` package's programmatic Compiler API, which is incompatible with the installed `typescript` v7
(the Go rewrite) and crashes on load.

### Docker

Multi-stage `Dockerfile` (`builder` compiles TS, `production` runs `dist/` only, as a non-root user).
Three Compose files select which `.env.*` file backs the `postgres`/`backend` services — `docker compose`
alone does not pick one for you:

```bash
docker compose -f docker-compose.dev.yml up --build      # dev — uses .env.dev, Postgres port 5432 published
docker compose -f docker-compose.prod.yml up --build -d  # prod — uses .env.prod, Postgres not published to host
docker compose up --build                                 # base — uses .env, ports from PORT/DB_PORT vars
```

In all three, `backend`'s `DB_HOST` is overridden to `postgres` (the Compose service name) regardless of what
`.env*` says, and `backend` waits on `postgres`'s healthcheck before starting.

### Database migrations (drizzle-kit)

Schema lives in `src/adapters/output/persistence/postgres/schema.ts`; migrations are generated into
`src/adapters/output/persistence/postgres/drizzle/migrations/`. Use `npx drizzle-kit generate` /
`npx drizzle-kit migrate` (config: `drizzle.config.ts`, builds the connection URL from `DB_HOST`/`DB_PORT`/
`DB_USER`/`DB_PASSWORD`/`DB_NAME` in `.env`).

## Architecture

Hexagonal architecture (ports & adapters). Dependency rule: **outer layers import inner layers, never the reverse.**

```
src/
├── domain/          # Pure business entities — no framework imports allowed
│   └── rules/       # Rule base class + registry, one subclass per rule type,
│                    # branded value types with their validation, InvalidRuleValueError
├── application/
│   ├── ports/       # RuleRepository — what the app needs from the outside world
│   ├── useCases/    # addRules, removeRules, updateRuleStatus, getRules — orchestration only
│   └── errors.ts    # RuleNotFoundError
├── adapters/
│   ├── input/
│   │   ├── controller/   # FirewallController — thin: reads body, calls use case, formats response
│   │   └── http/         # Router, shape-validation middleware, central error handler
│   └── output/
│       └── persistence/
│           ├── inMemory/  # InMemoryRuleRepository — used by unit tests, not wired into the app
│           └── postgres/  # DrizzleRuleRepository — the live implementation (see below)
└── main/            # Wiring only: app.ts constructs instances and registers middleware;
                     # index.ts waits for the DB then starts the server; env.ts / Logger.ts are
                     # cross-cutting setup imported from here
```

### Key boundaries

- `domain/` and `application/` must never import from `adapters/`, `main/`, or any framework (Express, DB drivers).
- `adapters/` may import from `application/` and `domain/`, never from `main/`.
- `main/` is the only place that knows about both concrete adapters and use cases simultaneously.
- Controllers stay thin: read the already-shape-validated body, call the use case, format the response. No business logic, and **no try/catch** — thrown errors are handled centrally.

### Where validation lives

Two distinct concerns, deliberately kept apart:

- **Request shape** — `validate*Request` functions in `adapters/input/http/Validation.ts` are pure checks
  (is `values` a non-empty array? is `mode` one of the two allowed strings? are `ids` integers?);
  `adapters/input/http/Middleware.ts` wraps each as Express middleware and forwards failures via `next(err)`.
  Type-agnostic, so every endpoint reuses the matching `validate*` middleware unchanged.
- **Business rules** (`domain/rules/*Type.ts`) — is this a real IPv4 / bare domain / port in range? Throws `InvalidRuleValueError` with a `code` (`INVALID_IP`, `INVALID_DOMAIN`, `INVALID_PORT`).

`ErrorHandler.ts` maps `InvalidRequestError`, `InvalidRuleValueError`, `RuleNotFoundError`, and malformed-JSON
`SyntaxError` to the spec's error response, then falls back to a 500. Adding an error case means throwing a
typed error, not writing status-code logic in a controller.

### Domain model

`Rule` (`domain/rules/Rule.ts`) is an abstract base class with a static registry. Each subclass calls
`Rule.register(type, ctor)` at module load, and `Rule.build(type, rawValue, active?)` dispatches to the
right one. Registration is an **import side effect**, so every subclass must be listed in
`domain/rules/index.ts` — importing `Rule` from anywhere else risks an empty registry.

A rule carries `value` (branded string), `type` (`'ip' | 'domain' | 'port'`), and `active` (mutable via
`activate()`/`deactivate()`, defaults to `true`). `id` and `mode` (`'blacklist' | 'whitelist'`) belong to
storage, not the entity — `RuleRepository.add` assigns a single shared id sequence across all types and
modes (see `StoredRule` in `application/ports/RuleRepository.ts`).

### Persistence (Postgres via Drizzle)

`DrizzleRuleRepository` (`adapters/output/persistence/postgres/`) is wired into `main/app.ts` and is the
only `RuleRepository` implementation the app actually runs on; `InMemoryRuleRepository` still exists purely
as a test double. Storage is split across four tables (`schema.ts`): a shared `rule_index` (id, type, mode,
active) plus one value table per type (`ip_rules`, `domain_rules`, `port_rules`), joined on `id` with
`ON DELETE CASCADE`. `db.ts` builds the Drizzle client from `config.databaseUri`; `connect.ts` exposes
`connectWithRetry` (fixed-interval "stop-and-wait") and `connectWithBackoff` (exponential, capped) —
`main/index.ts` calls `connectWithRetry` before `app.listen`, so the server does not start accepting
traffic until the DB is reachable.

### Environment & logging

`main/env.ts` validates `process.env` with `zod` at import time (`ENV`, `PORT`, `DB_HOST`, `DB_PORT`,
`DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_CONNECTION_INTERVAL`) and `process.exit(1)`s with the issue list
if anything is missing or malformed — fail fast, no partially-configured app. It also builds the Postgres
connection URI from those `DB_*` parts and exports the shared `config` object (including `databaseUri`,
`apiPrefix`, `/api/firewall`).

`main/Logger.ts` builds a Winston logger (JSON to `logs/app.log` in production, colorized console
otherwise) and then **overrides the global `console.log`/`console.error`/`console.warn`** to route through
it. It must be imported first in `main/index.ts` (`import './Logger'`), before anything that might log,
so that all `console.*` calls anywhere in the codebase get picked up.

### Adding a new rule type

1. Add a branded value type + `createX`/`isValidX` in `domain/rules/xType.ts` (throw `InvalidRuleValueError`).
2. Add `XRule extends Rule` with a static `create`, ending in `Rule.register('x', XRule)`.
3. List it in `domain/rules/index.ts` — otherwise `Rule.build('x', …)` throws "No Rule class registered".
4. Add `x` to `RULE_TYPES`/`RuleType` in `domain/rules/RuleTypes.ts`.
5. Add a table for it in `schema.ts` (id FK to `rule_index`, cascade delete) and an entry in
   `DrizzleRuleRepository`'s `TYPE_TABLE` map, then generate/run a migration.
6. Add a controller method calling `addRules(this.repository, 'x', values, mode)`.
7. Add one router line with the existing `validateAddRule` middleware.

The use case layer, validation middleware, and error handler are type-agnostic and need no changes.

### API surface

All routes are mounted under `config.apiPrefix` (`/api/firewall`) and are implemented:

| Method | Path |
|---|---|
| `POST` | `/api/firewall/ips` |
| `POST` | `/api/firewall/domains` |
| `POST` | `/api/firewall/ports` |
| `DELETE` | `/api/firewall/rules` |
| `GET` | `/api/firewall/rules` |
| `PATCH` | `/api/firewall/rules/status` |

`addRules`, `removeRules`, and `updateRuleStatus` are all-or-nothing per batch: `removeRules` and
`updateRuleStatus` look up every id first and throw `RuleNotFoundError` if any are missing before mutating
anything; `addRules` builds every `Rule` (which validates) before persisting any of them.

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
