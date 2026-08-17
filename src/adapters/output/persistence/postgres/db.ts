import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { config } from '../../../../main/env';

export const db: NodePgDatabase = drizzle(config.databaseUri, { logger: config.env !== 'production' });
