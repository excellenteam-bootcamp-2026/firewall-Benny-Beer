import { Rule, RuleType, RuleMode } from '../../domain/rules';
import { RuleRepository } from '../ports/RuleRepository';

export interface AddedRule {
  id: number;
  rule: Rule;
}

/**
 * Builds every rule before persisting any, so a single invalid value rejects
 * the whole batch — the API contract has no partial-success response shape.
 */
export async function addRules(
  repository: RuleRepository,
  type: RuleType,
  rawValues: (string | number)[],
  mode: RuleMode,
): Promise<AddedRule[]> {
  const rules = rawValues.map((rawValue) => Rule.build(type, rawValue));

  return Promise.all(rules.map(async (rule) => ({ id: await repository.add(rule, mode), rule })));
}
