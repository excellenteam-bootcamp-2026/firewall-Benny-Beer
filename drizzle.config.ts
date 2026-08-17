/// <reference types="node" />
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './src/adapters/output/persistence/postgres/drizzle/migrations',
  schema: './src/adapters/output/persistence/postgres/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.ENV === 'production'
      ? process.env.DATABASE_URI_PRODUCTION!
      : process.env.DATABASE_URI_DEV!,
  },
  verbose: true,
  strict: true,
});
