import { FirewallRule, RuleType, RuleMode } from '../../domain/FirewallRule';
import { IFirewallRepository } from '../repository/IFirewallRepository';
import { IFirewallService, GetRulesResult, GroupedByMode } from './IFirewallService';

export class FirewallService implements IFirewallService {
  constructor(private readonly repo: IFirewallRepository) {}

  /**
   * Builds FirewallRule objects for each value, assigns unique IDs, and saves them.
   * @param values - IP addresses, domains, or ports to add.
   * @param type   - Resource type shared by all values.
   * @param mode   - blacklist or whitelist.
   * @returns The newly persisted rules.
   */
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

  /**
   * Deletes rules by ID and verifies every requested ID was found.
   * @param ids - IDs of rules to delete.
   * @returns The removed rules.
   * @throws 404 NOT_FOUND if any ID is missing from storage.
   */
  removeRules(ids: number[]): FirewallRule[] {
    const removed = this.repo.removeRulesByIds(ids);
    if (removed.length !== ids.length) {
      const foundIds = new Set(removed.map((r) => r.id));
      const missing = ids.filter((id) => !foundIds.has(id));
      throw Object.assign(new Error(`Rules not found: ${missing.join(', ')}`), { code: 'NOT_FOUND', status: 404 });
    }
    return removed;
  }

  /**
   * Fetches all rules and groups them by type and mode.
   * @param type - Optional filter; when given only that type's group is returned.
   * @returns An object with blacklist/whitelist arrays nested under each type key.
   */
  getRules(type?: RuleType): GetRulesResult {
    const all = this.repo.getRules();

    /** Splits all rules of a given type into blacklist and whitelist arrays. */
    const group = (ruleType: RuleType): GroupedByMode => ({
      blacklist: all.filter((r) => r.type === ruleType && r.mode === 'blacklist'),
      whitelist: all.filter((r) => r.type === ruleType && r.mode === 'whitelist'),
    });

    if (type === 'ip') return { ips: group('ip') };
    if (type === 'domain') return { domains: group('domain') };
    if (type === 'port') return { ports: group('port') };

    return { ips: group('ip'), domains: group('domain'), ports: group('port') };
  }

  /**
   * Updates the `active` flag on a set of rules and verifies every ID was found.
   * @param ids    - IDs of rules to update.
   * @param active - New active state to apply.
   * @returns The updated rules.
   * @throws 404 NOT_FOUND if any ID is missing from storage.
   */
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
