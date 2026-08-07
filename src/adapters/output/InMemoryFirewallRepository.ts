import { FirewallRule } from '../../core/domain/FirewallRule';
import { IFirewallRepository } from '../../core/ports/output/IFirewallRepository';

/** In-memory implementation of IFirewallRepository. All data is lost on process restart. */
export class InMemoryFirewallRepository implements IFirewallRepository {
  private readonly store = new Map<number, FirewallRule>();
  private counter = 0;

  /** Increments the internal counter and returns the new value as the next rule ID. */
  nextId(): number {
    return ++this.counter;
  }

  /**
   * Stores each rule in the map keyed by its ID.
   * @param rules - Rules to persist.
   */
  addRules(rules: FirewallRule[]): void {
    for (const rule of rules) {
      this.store.set(rule.id, rule);
    }
  }

  /**
   * Removes rules with the given IDs from the store.
   * @param ids - IDs to delete.
   * @returns Rules that were found and deleted; missing IDs produce no entry.
   */
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

  /** Returns all stored rules as an array in insertion order. */
  getRules(): FirewallRule[] {
    return Array.from(this.store.values());
  }

  /**
   * Mutates the `active` field of rules matching the given IDs.
   * @param ids    - IDs of rules to update.
   * @param active - New active state.
   * @returns Rules that were found and updated; missing IDs produce no entry.
   */
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
