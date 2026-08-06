export type RuleType = 'ip' | 'domain' | 'port';
export type RuleMode = 'blacklist' | 'whitelist';

export interface FirewallRule {
  id: number;
  value: string | number;
  type: RuleType;
  mode: RuleMode;
  active: boolean;
}
