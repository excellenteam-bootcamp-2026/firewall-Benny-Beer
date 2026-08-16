import { RuleRepository, StoredRule } from '../ports/RuleRepository';
import { RuleNotFoundError } from '../errors';

/**
 * Looks up every id before mutating any, so a single missing id rejects the
 * whole batch — same all-or-nothing contract as addRules.
 */
export function updateRuleStatus(
  repository: RuleRepository,
  ids: number[],
  active: boolean,
): StoredRule[] {
  const found = ids.map((id) => repository.search(id));
  const missing = ids.filter((_, i) => !found[i]);

  if (missing.length > 0) {
    throw new RuleNotFoundError(`Rule id(s) not found: ${missing.join(', ')}`);
  }

  const storedRules = found as StoredRule[];
  storedRules.forEach(({ rule }) => (active ? rule.activate() : rule.deactivate()));

  return storedRules;
}
