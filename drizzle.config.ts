/// <reference types="node" />
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './src/adapters/output/persistence/postgres/drizzle/migrations',
  schema: './src/adapters/output/persistence/postgres/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: `postgresql://${encodeURIComponent(process.env.DB_USER!)}:${encodeURIComponent(process.env.DB_PASSWORD!)}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  },
  verbose: true,
  strict: true,
});
