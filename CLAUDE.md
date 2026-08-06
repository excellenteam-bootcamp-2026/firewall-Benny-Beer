# Project: EXCELLENTEAM App

A Node.js/TypeScript backend built with hexagonal architecture (ports & adapters).

## Stack
- TypeScript
- Node.js
- Express
- npm

## Architecture
This project follows hexagonal architecture. See `rules.md` for the full rules —
the short version:

- `src/core` = business logic. Must NEVER import Express, a database driver,
  or anything from `src/adapters`.
- `src/core/ports` = interfaces only (input ports = how the app is driven,
  output ports = what the app needs from the outside world).
- `src/adapters` = concrete implementations that plug into ports
  (`adapters/input/http` = Express controllers, `adapters/output` = repositories, etc).
- `src/infrastructure` = wiring/config — the only place allowed to know about
  both the core and the concrete adapters at once.

## Commands
- `npm install` — install dependencies
- `npm run dev` — run the dev server with nodemon + ts-node
- `npm run build` — compile TypeScript to `dist/`
- `npm start` — run the compiled app

## Git workflow
This repo follows GitHub Flow:
- `master` is the stable, always-deployable branch.
- All work happens on feature branches (e.g. `feature/xyz`), merged via Pull Request.
- Do not commit directly to `master`.

## Notes for Claude
- Full coding/architecture rules live in `rules.md` — read it before making
  structural changes.
- Ask before modifying `tsconfig.json`, `package.json`, or anything in `.claude/`.