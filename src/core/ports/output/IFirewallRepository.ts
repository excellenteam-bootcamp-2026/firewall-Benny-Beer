import { FirewallRule } from '../../domain/FirewallRule';

export interface IFirewallRepository {
  nextId(): number;
  addRules(rules: FirewallRule[]): void;
  removeRulesByIds(ids: number[]): FirewallRule[];
  getRules(): FirewallRule[];
  updateRulesStatus(ids: number[], active: boolean): FirewallRule[];
}
