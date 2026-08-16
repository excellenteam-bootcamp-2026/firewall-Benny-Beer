import { Router } from 'express';
import { FirewallController } from '../controller/FirewallController';
import { validateAddRule } from './Middleware';

/**
 * Builds an Express Router with the firewall API endpoints mounted.
 * @param controller - Controller instance whose handler methods are bound to each route.
 */
export function createFirewallRouter(controller: FirewallController): Router {
  const router = Router();

  router.post('/api/firewall/ips', validateAddRule, controller.addRule('ip'));
  router.post('/api/firewall/domains', validateAddRule, controller.addRule('domain'));
  router.post('/api/firewall/ports', validateAddRule, controller.addRule('port'));

  return router;
}
