import { Rule, RuleType } from '../../../../domain/rules';
import { RuleMode } from '../../../../domain/rules/RuleTypes';
import { RuleRepository, StoredRule } from '../../../../application/ports/RuleRepository';

export class InMemoryRuleRepository implements RuleRepository {
  private nextId = 1;

  private rulesById = new Map<number, StoredRule>();

  add(rule: Rule, mode: RuleMode): number {
    const id = this.nextId++;
    this.rulesById.set(id, { id, rule, mode });
    return id;
  }

  search(id: number): StoredRule | undefined {
    return this.rulesById.get(id);
  }

  delete(id: number): StoredRule | undefined {
    const found = this.rulesById.get(id);
    if (found) this.rulesById.delete(id);
    return found;
  }

  findAll(type?: RuleType): StoredRule[] {
    const all = Array.from(this.rulesById.values());
    return type ? all.filter((stored) => stored.rule.type === type) : all;
  }
}
