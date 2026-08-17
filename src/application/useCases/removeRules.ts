import { RuleRepository, StoredRule } from '../ports/RuleRepository';
import { RuleNotFoundError } from '../errors';

/**
 * Looks up every id before deleting any, so a single missing id rejects the
 * whole batch — same all-or-nothing contract as addRules.
 */
export async function removeRules(repository: RuleRepository, ids: number[]): Promise<StoredRule[]> {
  const found = await repository.searchMany(ids);
  const foundIds = new Set(found.map((stored) => stored.id));
  const missing = ids.filter((id) => !foundIds.has(id));

  if (missing.length > 0) {
    throw new RuleNotFoundError(`Rule id(s) not found: ${missing.join(', ')}`);
  }

  return repository.deleteMany(ids);
}
