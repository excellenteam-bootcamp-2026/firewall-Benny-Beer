import { Rule, RuleType, RuleMode } from '../../domain/rules';
import { RuleRepository } from '../ports/RuleRepository';
import { DuplicateRuleError } from '../errors';

export interface AddedRule {
  id: number;
  rule: Rule;
}

/**
 * Builds every rule before persisting any, so a single invalid value rejects
 * the whole batch — the API contract has no partial-success response shape.
 * A value is unique per type globally, across both modes, so duplicates are
 * checked against already-persisted rows before anything is written.
 */
export async function addRules(
  repository: RuleRepository,
  type: RuleType,
  rawValues: (string | number)[],
  mode: RuleMode,
): Promise<AddedRule[]> {
  const rules = rawValues.map((rawValue) => Rule.build(type, rawValue));

  const duplicates = await repository.findByValue(
    type,
    rules.map((rule) => rule.value),
  );
  if (duplicates.length > 0) {
    const values = duplicates.map((stored) => stored.rule.value).join(', ');
    throw new DuplicateRuleError(`Rule value(s) already exist: ${values}`);
  }

  return Promise.all(rules.map(async (rule) => ({ id: await repository.add(rule, mode), rule })));
}
