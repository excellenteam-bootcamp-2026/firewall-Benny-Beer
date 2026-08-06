import { FirewallRule, RuleType, RuleMode } from '../../domain/FirewallRule';

export interface GroupedByMode {
  blacklist: FirewallRule[];
  whitelist: FirewallRule[];
}

export interface GetRulesResult {
  ips?: GroupedByMode;
  domains?: GroupedByMode;
  ports?: GroupedByMode;
}

export interface IFirewallService {
  addRules(values: (string | number)[], type: RuleType, mode: RuleMode): FirewallRule[];
  removeRules(ids: number[]): FirewallRule[];
  getRules(type?: RuleType): GetRulesResult;
  updateStatus(ids: number[], active: boolean): FirewallRule[];
}
