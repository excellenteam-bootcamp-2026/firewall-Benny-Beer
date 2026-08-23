import type { Config } from 'jest';

// .env.dev sets DB_HOST=postgres, a Docker Compose network hostname that only
// resolves from inside that network. Postgres is published to localhost:5432
// on the host (docker-compose.dev.yml), so default to that when nothing else
// already supplies DB_HOST (e.g. when actually running inside the network).

process.env.DB_HOST = 'localhost';


const config: Config = {
  testEnvironment: 'node',
  coverageProvider: 'v8',
  transform: {
    '^.+\\.ts$': '@swc/jest',
  },
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  globalSetup: '<rootDir>/tests/globalSetup.ts',
  // Tests share one live Postgres instance with no per-test transaction/rollback
  // isolation, so parallel workers would race each other's inserts/deletes.
  maxWorkers: 1,
  // Each test file gets its own pg Pool (Jest isolates module registries per
  // file); closing every one individually is brittle against afterAll ordering
  // across files, so just force the process down once all tests have finished.
  forceExit: true,
  collectCoverageFrom: ['src/**/*.ts'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    // Server bootstrap — calls app.listen for real, not exercised in tests.
    'src/main/index.ts',
    // Mutates global console.*; side-effect-only, nothing to assert on.
    'src/main/Logger.ts',
    // Only called from main/index.ts and from Jest's globalSetup, which Jest
    // does not instrument for coverage either way.
    'src/adapters/output/persistence/postgres/connect.ts',
    // Declarative table/column/FK definitions. The .references()/index()
    // callbacks are lazily invoked only by drizzle-kit's migration tooling
    // (already run separately via `drizzle-kit generate`/`migrate`), never by
    // the queries this app issues at runtime.
    'src/adapters/output/persistence/postgres/schema.ts',
    // Pure TypeScript interfaces — erased at compile time, zero runtime
    // statements. The v8 coverage provider misreports type-only files like
    // this as 0% rather than skipping them.
    'src/application/ports/RuleRepository.ts',
  ],
  coverageThreshold: {
    global: {
      statements: 100,
    },
  },
};

export default config;
