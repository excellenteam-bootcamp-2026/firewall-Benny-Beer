export type RuleMode = 'blacklist' | 'whitelist';

export type RuleType = 'ip' | 'domain' | 'port';

export const RULE_TYPES: readonly RuleType[] = ['ip', 'domain', 'port'];