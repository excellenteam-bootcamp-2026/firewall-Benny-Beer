import './Logger';
import app from './app';
import { config } from './env';
import { connectWithRetry } from '../adapters/output/persistence/postgres/connect';

/** Waits for the database to be reachable, then starts the HTTP server. */
async function main(): Promise<void> {
  await connectWithRetry();

  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port} [${config.env}]`);
  });
}

main();
