import { FirewallRule, RuleType, RuleMode } from '../../domain/FirewallRule';

/** Rules of a single type grouped by their mode (blacklist / whitelist). */
export interface GroupedByMode {
  blacklist: FirewallRule[];
  whitelist: FirewallRule[];
}

/** Shape returned by getRules — each key is present only when its type was requested. */
export interface GetRulesResult {
  ips?: GroupedByMode;
  domains?: GroupedByMode;
  ports?: GroupedByMode;
}

/** Driving port — defines the use cases the HTTP adapter may invoke. */
export interface IFirewallService {
  /**
   * Creates new firewall rules for the given values and persists them.
   * @param values - Raw IP addresses, domain names, or port numbers to add.
   * @param type   - The resource type all values belong to.
   * @param mode   - Whether the rules block or allow the values.
   * @returns The newly created rules with assigned IDs.
   */
  addRules(values: (string | number)[], type: RuleType, mode: RuleMode): FirewallRule[];

  /**
   * Removes rules by ID from storage.
   * @param ids - IDs of rules to delete.
   * @returns The deleted rules.
   * @throws 404 NOT_FOUND if any ID does not exist.
   */
  removeRules(ids: number[]): FirewallRule[];

  /**
   * Retrieves all stored rules grouped by type and mode.
   * @param type - When provided, only the matching type group is returned.
   * @returns An object with one or all type groups.
   */
  getRules(type?: RuleType): GetRulesResult;

  /**
   * Toggles the `active` flag on a set of rules.
   * @param ids    - IDs of rules to update.
   * @param active - The new active state to apply to every matched rule.
   * @returns The updated rules.
   * @throws 404 NOT_FOUND if any ID does not exist.
   */
  updateStatus(ids: number[], active: boolean): FirewallRule[];
}
