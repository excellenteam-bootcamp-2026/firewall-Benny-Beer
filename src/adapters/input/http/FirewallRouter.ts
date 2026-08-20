import { Router } from 'express';
import { FirewallController } from '../controller/FirewallController';
import { validateAddRule, validateRemoveRules, validateUpdateStatus, validateGetRules } from './Middleware';

/**
 * Builds an Express Router with the firewall API endpoints mounted.
 * @param controller - Controller instance whose handler methods are bound to each route.
 * @param apiPrefix - Base path all routes are mounted under, e.g. '/api/firewall'.
 */
export function createFirewallRouter(controller: FirewallController, apiPrefix: string): Router {
  const router = Router();

  router.post(`${apiPrefix}/ips`, validateAddRule, controller.addRule('ip'));
  router.post(`${apiPrefix}/domains`, validateAddRule, controller.addRule('domain'));
  router.post(`${apiPrefix}/ports`, validateAddRule, controller.addRule('port'));

  router.delete(`${apiPrefix}/rules`, validateRemoveRules, controller.removeRules);
  router.get(`${apiPrefix}/rules`, validateGetRules, controller.getRules);
  router.patch(`${apiPrefix}/rules/status`, validateUpdateStatus, controller.updateStatus);

  return router;
}
