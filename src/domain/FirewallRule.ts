/** The type of resource a firewall rule targets. */
export type RuleType = 'ip' | 'domain' | 'port';

/** Whether the rule blocks or allows the target. */
export type RuleMode = 'blacklist' | 'whitelist';

/** A single firewall rule stored in memory. */
export interface FirewallRule {
  /** Auto-incremented unique identifier across all rule types. */
  id: number;
  /** The IP address, domain name, or port number this rule applies to. */
  value: string | number;
  /** The kind of resource this rule targets. */
  type: RuleType;
  /** Whether this rule blocks or allows the value. */
  mode: RuleMode;
  /** When false the rule exists but is not enforced. */
  active: boolean;
}
