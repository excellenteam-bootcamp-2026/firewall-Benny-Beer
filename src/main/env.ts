import { z } from 'zod';

function hasPort(uri: string): boolean {
  try {
    return new URL(uri).port !== '';
  } catch {
    return false;
  }
}

const envSchema = z.object({
  ENV: z.enum(['dev', 'production']),
  PORT: z.coerce.number().int().min(1).max(65535),
  DATABASE_URI_DEV: z
    .string()
    .url()
    .refine(hasPort, 'must include a port, e.g. postgresql://user:pass@host:5432/db'),
  DATABASE_URI_PRODUCTION: z
    .string()
    .url()
    .refine(hasPort, 'must include a port, e.g. postgresql://user:pass@host:5432/db'),
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

const DATABASE_URI_BY_ENV: Record<typeof env.ENV, string> = {
  dev: env.DATABASE_URI_DEV,
  production: env.DATABASE_URI_PRODUCTION,
};

export const API_PREFIX = '/api/firewall';

export const config = {
  env: env.ENV,
  port: env.PORT,
  databaseUri: DATABASE_URI_BY_ENV[env.ENV],
  apiPrefix: API_PREFIX,
} as const;
