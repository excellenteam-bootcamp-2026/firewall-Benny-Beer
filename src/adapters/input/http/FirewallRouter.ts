import { Router } from 'express';
import { FirewallController } from './FirewallController';

/**
 * Builds and returns an Express Router with all six firewall API endpoints mounted.
 * @param controller - Controller instance whose handler methods are bound to each route.
 */
export function createFirewallRouter(controller: FirewallController): Router {
  const router = Router();

  router.post('/api/firewall/ips', controller.addIps);
  router.post('/api/firewall/domains', controller.addDomains);
  router.post('/api/firewall/ports', controller.addPorts);
  router.delete('/api/firewall/rules', controller.removeRules);
  router.get('/api/firewall/rules', controller.getRules);
  router.patch('/api/firewall/rules/status', controller.updateStatus);

  return router;
}
