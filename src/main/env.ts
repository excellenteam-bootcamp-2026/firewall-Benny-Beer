import { z } from 'zod';

const envSchema = z.object({
  ENV: z.enum(['dev', 'production']),
  PORT: z.coerce.number().int().min(1).max(65535),
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().min(1).max(65535),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string().min(1),
  DB_CONNECTION_INTERVAL: z.coerce.number().int().positive(),
});

export function parseEnv(raw: NodeJS.ProcessEnv) {
  return envSchema.safeParse(raw);
}

const parsed = parseEnv(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

const env = parsed.data;

const databaseUri = `postgresql://${encodeURIComponent(env.DB_USER)}:${encodeURIComponent(env.DB_PASSWORD)}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`;

export const API_PREFIX = '/api/firewall';

export const config = {
  env: env.ENV,
  port: env.PORT,
  databaseUri,
  dbConnectionInterval: env.DB_CONNECTION_INTERVAL,
  apiPrefix: API_PREFIX,
} as const;
