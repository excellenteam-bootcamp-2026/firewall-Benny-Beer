import { FirewallRule } from '../../domain/FirewallRule';

/** Driven port — abstracts the storage layer from the domain. */
export interface IFirewallRepository {
  /** Returns the next available unique rule ID and advances the counter. */
  nextId(): number;

  /** Persists an array of already-constructed rules. */
  addRules(rules: FirewallRule[]): void;

  /**
   * Deletes rules matching the given IDs and returns those that were found and removed.
   * IDs that do not exist are silently skipped; the caller is responsible for detecting gaps.
   */
  removeRulesByIds(ids: number[]): FirewallRule[];

  /** Returns all currently stored rules in insertion order. */
  getRules(): FirewallRule[];

  /**
   * Sets the `active` flag on rules matching the given IDs and returns the updated rules.
   * IDs that do not exist are silently skipped; the caller is responsible for detecting gaps.
   */
  updateRulesStatus(ids: number[], active: boolean): FirewallRule[];
}
