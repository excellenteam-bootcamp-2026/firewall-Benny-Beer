import { FirewallRule, RuleType, RuleMode } from '../domain/FirewallRule';
import { IFirewallRepository } from '../ports/output/IFirewallRepository';
import { IFirewallService, GetRulesResult, GroupedByMode } from '../ports/input/IFirewallService';

export class FirewallService implements IFirewallService {
  constructor(private readonly repo: IFirewallRepository) {}

  addRules(values: (string | number)[], type: RuleType, mode: RuleMode): FirewallRule[] {
    const rules: FirewallRule[] = values.map((value) => ({
      id: this.repo.nextId(),
      value,
      type,
      mode,
      active: true,
    }));
    this.repo.addRules(rules);
    return rules;
  }

  removeRules(ids: number[]): FirewallRule[] {
    const removed = this.repo.removeRulesByIds(ids);
    if (removed.length !== ids.length) {
      const foundIds = new Set(removed.map((r) => r.id));
      const missing = ids.filter((id) => !foundIds.has(id));
      throw Object.assign(new Error(`Rules not found: ${missing.join(', ')}`), { code: 'NOT_FOUND', status: 404 });
    }
    return removed;
  }

  getRules(type?: RuleType): GetRulesResult {
    const all = this.repo.getRules();

    const group = (ruleType: RuleType): GroupedByMode => ({
      blacklist: all.filter((r) => r.type === ruleType && r.mode === 'blacklist'),
      whitelist: all.filter((r) => r.type === ruleType && r.mode === 'whitelist'),
    });

    if (type === 'ip') return { ips: group('ip') };
    if (type === 'domain') return { domains: group('domain') };
    if (type === 'port') return { ports: group('port') };

    return { ips: group('ip'), domains: group('domain'), ports: group('port') };
  }

  updateStatus(ids: number[], active: boolean): FirewallRule[] {
    const updated = this.repo.updateRulesStatus(ids, active);
    if (updated.length !== ids.length) {
      const foundIds = new Set(updated.map((r) => r.id));
      const missing = ids.filter((id) => !foundIds.has(id));
      throw Object.assign(new Error(`Rules not found: ${missing.join(', ')}`), { code: 'NOT_FOUND', status: 404 });
    }
    return updated;
  }
}
