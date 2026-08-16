import { RuleRepository, StoredRule } from '../ports/RuleRepository';
import { RuleNotFoundError } from '../errors';

/**
 * Looks up every id before deleting any, so a single missing id rejects the
 * whole batch — same all-or-nothing contract as addRules.
 */
export function removeRules(repository: RuleRepository, ids: number[]): StoredRule[] {
  const found = ids.map((id) => repository.search(id));
  const missing = ids.filter((_, i) => !found[i]);

  if (missing.length > 0) {
    throw new RuleNotFoundError(`Rule id(s) not found: ${missing.join(', ')}`);
  }

  return ids.map((id) => repository.delete(id)!);
}
