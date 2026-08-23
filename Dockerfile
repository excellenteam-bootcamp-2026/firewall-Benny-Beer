# =========================================================
# Stage 1: Build — installs all deps and compiles TypeScript
# =========================================================
FROM node:20-alpine AS builder
# Alpine keeps the image small; used only as a build environment here,
# discarded after this stage (not part of the final image)

WORKDIR /app
# All following commands run relative to /app inside this build stage

COPY package.json package-lock.json ./
RUN npm ci
# Installs ALL dependencies, including devDependencies (typescript, tsx, etc.)
# — required here since we need the TS compiler to build.
# npm ci (not npm install) = deterministic install strictly from package-lock.json

COPY tsconfig.json ./
COPY src ./src
# Copy only what's needed to compile: TS config + source code
# (not the whole repo — .dockerignore also prevents node_modules/dist from leaking in)

RUN npm run build
# Runs "tsc" (per package.json's build script), compiling src/**/*.ts -> dist/**/*.js
# per tsconfig.json's rootDir/outDir settings


# =========================================================
# Stage 2: Production — minimal runtime image, no build tools
# =========================================================
FROM node:20-alpine AS production
# Fresh, minimal base image for the final stage — no leftover build tools or TS source
# from the builder stage end up here unless explicitly copied over

WORKDIR /app
# All subsequent commands (COPY, RUN, CMD) run relative to /app inside the container

ENV NODE_ENV=production
# Baked into the image permanently. Tells Node/Express/npm-ecosystem tooling to run in
# production mode (perf optimizations, less verbose errors) — independent of your own
# app-level ENV var (dev/production) that comes from env_file at runtime

RUN addgroup -S nodejs && adduser -S nodeuser -G nodejs
# Creates an unprivileged system user/group. Used later so the app doesn't run as root
# (security hardening — limits damage if the app is ever compromised)

COPY package.json package-lock.json ./
RUN npm ci --omit=dev
# Installs ONLY production dependencies (excludes typescript, tsx, nodemon, etc.)
# --omit=dev keeps the final image smaller and reduces attack surface

COPY --from=builder /app/dist ./dist
# Pulls in only the compiled JS output from the "builder" stage above —
# no .ts source files, no build tools ship in this final image

RUN mkdir -p /app/logs && chown -R nodeuser:nodejs /app
# Pre-creates the logs directory (used by winston in production) and gives nodeuser
# ownership of /app. Must run BEFORE switching users — chown requires root.
# Without this, the app would get EACCES trying to write logs as nodeuser

USER nodeuser
# From this point on (including CMD at runtime), the process runs as the unprivileged
# nodeuser instead of root

EXPOSE 3000
# Documents which port the app listens on inside the container (matches PORT in .env).
# Purely informational — does NOT actually publish the port; that's done via
# "ports:" in docker-compose or "-p" on docker run

CMD ["node", "dist/main/index.js"]
# Exec form (not shell form) — runs node directly as PID 1, so it correctly
# receives SIGTERM on container stop/shutdown instead of the signal being swallowed