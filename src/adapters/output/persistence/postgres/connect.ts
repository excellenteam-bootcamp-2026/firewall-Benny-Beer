import { db } from './db';
import { config } from '../../../../main/env';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ping(): Promise<void> {
  await db.execute('select 1');
}

/** Stop and Wait: on failure, re-sends the connection request every DB_CONNECTION_INTERVAL ms until it succeeds. */
export async function connectWithRetry(): Promise<void> {
  for (;;) {
    try {
      await ping();
      console.log('Database connection established');
      return;
    } catch (err) {
      console.error(`Database connection failed, retrying in ${config.dbConnectionInterval}ms`, err);
      await sleep(config.dbConnectionInterval);
    }
  }
}

/** Exponential Backoff: same as connectWithRetry, but the wait interval doubles after each failure, capped at maxIntervalMs. */
export async function connectWithBackoff(maxIntervalMs = 30_000): Promise<void> {
  let interval = config.dbConnectionInterval;
  for (;;) {
    try {
      await ping();
      console.log('Database connection established');
      return;
    } catch (err) {
      console.error(`Database connection failed, retrying in ${interval}ms`, err);
      await sleep(interval);
      interval = Math.min(interval * 2, maxIntervalMs);
    }
  }
}
