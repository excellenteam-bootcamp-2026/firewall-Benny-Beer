import { FirewallRule } from '../../core/domain/FirewallRule';
import { IFirewallRepository } from '../../core/ports/output/IFirewallRepository';

export class InMemoryFirewallRepository implements IFirewallRepository {
  private readonly store = new Map<number, FirewallRule>();
  private counter = 0;

  nextId(): number {
    return ++this.counter;
  }

  addRules(rules: FirewallRule[]): void {
    for (const rule of rules) {
      this.store.set(rule.id, rule);
    }
  }

  removeRulesByIds(ids: number[]): FirewallRule[] {
    const removed: FirewallRule[] = [];
    for (const id of ids) {
      const rule = this.store.get(id);
      if (rule) {
        removed.push(rule);
        this.store.delete(id);
      }
    }
    return removed;
  }

  getRules(): FirewallRule[] {
    return Array.from(this.store.values());
  }

  updateRulesStatus(ids: number[], active: boolean): FirewallRule[] {
    const updated: FirewallRule[] = [];
    for (const id of ids) {
      const rule = this.store.get(id);
      if (rule) {
        rule.active = active;
        updated.push(rule);
      }
    }
    return updated;
  }
}
