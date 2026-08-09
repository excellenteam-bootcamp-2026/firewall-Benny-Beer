import express, { Request, Response, NextFunction } from 'express';
import { InMemoryFirewallRepository } from '../adapters/output/persistence/inMemory/InMemoryFirewallRepository';
import { FirewallService } from '../application/service/FirewallService';
import { FirewallController } from '../adapters/input/controller/FirewallController';
import { createFirewallRouter } from '../adapters/input/http/FirewallRouter';

const repo = new InMemoryFirewallRepository();
const service = new FirewallService(repo);
const controller = new FirewallController(service);

const app = express();

app.use(express.json());

/**
 * Logging middleware — prints the HTTP method and path of every incoming request.
 * @param req  - Incoming request.
 * @param _res - Unused response object.
 * @param next - Passes control to the next middleware.
 */
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${req.method}] ${req.path}`);
  next();
});

app.use(createFirewallRouter(controller));

export default app;
