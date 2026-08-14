import express, { Request, Response, NextFunction } from 'express';
import { InMemoryRuleRepository } from '../adapters/output/persistence/inMemory/InMemoryRuleRepository';
import { FirewallController } from '../adapters/input/controller/FirewallController';
import { createFirewallRouter } from '../adapters/input/http/FirewallRouter';
import { errorHandler } from '../adapters/input/http/ErrorHandler';

const repository = new InMemoryRuleRepository();
const controller = new FirewallController(repository);

const app = express();

app.use(express.json());

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${req.method}] ${req.path}`);
  next();
});

app.use(createFirewallRouter(controller));

app.use(errorHandler);

export default app;
