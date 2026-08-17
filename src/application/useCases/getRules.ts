import { RuleType, RULE_TYPES } from '../../domain/rules';
import { RuleRepository } from '../ports/RuleRepository';

interface RuleSummary {
  id: number;
  value: string | number;
  active: boolean;
}

interface RuleBucket {
  blacklist: RuleSummary[];
  whitelist: RuleSummary[];
}

const KEY_BY_TYPE: Record<RuleType, 'ips' | 'domains' | 'ports'> = {
  ip: 'ips',
  domain: 'domains',
  port: 'ports',
};

export async function getRules(repository: RuleRepository, type?: RuleType): Promise<Record<string, RuleBucket>> {
  const types: RuleType[] = type ? [type] : [...RULE_TYPES];
  const result: Record<string, RuleBucket> = {};

  for (const t of types) {
    const rules = await repository.findAll(t);

    result[KEY_BY_TYPE[t]] = {
      blacklist: rules
        .filter((stored) => stored.mode === 'blacklist')
        .map(({ id, rule }) => ({ id, value: rule.value, active: rule.active })),
      whitelist: rules
        .filter((stored) => stored.mode === 'whitelist')
        .map(({ id, rule }) => ({ id, value: rule.value, active: rule.active })),
    };
  }

  return result;
}
