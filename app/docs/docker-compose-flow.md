# `docker compose up` flow

Flow for `docker compose -f docker-compose.dev.yml up --build`. The base (`docker-compose.yml`) and
prod (`docker-compose.prod.yml`) files follow the same shape — they just differ in which `.env.*` file
is loaded and whether Postgres's port is published to the host.

```mermaid
flowchart TD
    A["docker compose -f docker-compose.dev.yml up --build"] --> B["Compose reads docker-compose.dev.yml
    + env_file: .env.dev"]

    B --> C["Build backend image from Dockerfile"]
    C --> C1["Stage 1 'builder':
    npm ci → copy src+tsconfig → npm run build (tsc)"]
    C1 --> C2["Stage 2 'production':
    npm ci --omit=dev → copy dist/ only
    create nodeuser, chown /app/logs, USER nodeuser"]

    B --> D["Start postgres service
    image: postgres:16-alpine
    env from .env.dev (POSTGRES_USER/PASSWORD/DB)"]
    D --> E{"Healthcheck:
    pg_isready -U $POSTGRES_USER -d $POSTGRES_DB
    every 5s, 5 retries"}
    E -- not ready --> E
    E -- healthy --> F["depends_on: postgres condition service_healthy
    → backend container allowed to start"]

    C2 --> F
    F --> G["backend container starts
    env_file: .env.dev, but DB_HOST overridden to 'postgres'
    (Compose service name, not localhost)"]

    G --> H["CMD: node dist/main/index.js"]
    H --> I["import './Logger' first
    — overrides console.log/error/warn"]
    I --> J["import './env'
    zod-validates process.env
    process.exit(1) if invalid"]
    J --> K{"connectWithRetry
    fixed-interval attempts to reach
    postgres:5432"}
    K -- fails --> K
    K -- connected --> L["app.listen(PORT)
    server starts accepting traffic"]
```

## Key points

- The **image build** (left branch) and **Postgres startup + healthcheck** (right branch) happen in
  parallel — Compose doesn't serialize them.
- `backend` is gated on Postgres's healthcheck via `depends_on: condition: service_healthy`, not just
  container-start.
- Even though `.env.dev` may say something else, `docker-compose.dev.yml` hardcodes `DB_HOST: postgres`
  for the `backend` service — that's the Compose network hostname, not what a developer would use running
  the app directly with `npm run dev`.
- Inside the container there's a second wait loop (`connectWithRetry` in `main/index.ts`) — so the app
  doesn't start serving until it can actually open a DB connection, on top of Docker's own healthcheck
  gate.
