# Project Rules

## Architecture rules (hexagonal / ports & adapters)

1. **`src/core` is framework-agnostic.**
   No file under `src/core` may import from `express`, a database library,
   or `src/adapters`. It should be plain TypeScript that could run anywhere.

2. **Ports are interfaces, defined inside `src/core/ports`.**
   - `ports/input` — interfaces describing how the outside world drives the app.
   - `ports/output` — interfaces describing what the app needs from the outside
     world (e.g. `UserRepository`).

3. **Adapters implement ports and live in `src/adapters`.**
   - `adapters/input/http` — Express routes/controllers that call into use cases.
   - `adapters/output` — concrete implementations of output ports
     (e.g. an in-memory or database-backed repository).
   - Adapters may import from `core`, never the other way around.

4. **`src/infrastructure` wires everything together.**
   This is the only layer allowed to import both concrete adapters and
   core use cases, and construct/inject them (e.g. `server.ts`).

5. **Use cases orchestrate, they don't implement I/O.**
   A use case in `src/core/use-cases` should depend only on ports (interfaces),
   never on a concrete adapter class.

## Coding conventions

- Use `camelCase` for variables/functions, `PascalCase` for classes and types.
- One class/interface per file where practical.
- Prefer explicit types over `any`; `strict` mode is enabled in `tsconfig.json`
  — do not weaken it without discussion.
- Keep controllers thin: parse the request, call a use case, format the response.
  No business logic in controllers.

## Git / GitHub Flow

- `master` is always deployable. Never commit directly to it.
- Create a feature branch per unit of work: `feature/<short-description>`.
- Commit messages: short, imperative summary line (e.g. `Add user repository port`).
- Open a Pull Request into `master` when ready; do not force-push shared branches
  without flagging it first.

## Things to always ask before doing

- Changing `tsconfig.json` compiler options.
- Adding new runtime dependencies (vs dev dependencies).
- Changing the default branch or repository settings.
- Force-pushing any branch other than your own fresh feature branch.