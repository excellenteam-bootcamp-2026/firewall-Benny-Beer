import { Rule, RuleType } from '../../../../domain/rules';
import { RuleMode } from '../../../../domain/rules/RuleTypes';
import { RuleRepository, StoredRule } from '../../../../application/ports/RuleRepository';

export class InMemoryRuleRepository implements RuleRepository {
  private nextId = 1;

  private rulesById = new Map<number, StoredRule>();

  async add(rule: Rule, mode: RuleMode): Promise<number> {
    const id = this.nextId++;
    this.rulesById.set(id, { id, rule, mode });
    return id;
  }

  async search(id: number): Promise<StoredRule | undefined> {
    return this.rulesById.get(id);
  }

  async searchMany(ids: number[]): Promise<StoredRule[]> {
    return ids
      .map((id) => this.rulesById.get(id))
      .filter((stored): stored is StoredRule => stored !== undefined);
  }

  async delete(id: number): Promise<StoredRule | undefined> {
    const found = this.rulesById.get(id);
    if (found) this.rulesById.delete(id);
    return found;
  }

  async deleteMany(ids: number[]): Promise<StoredRule[]> {
    const found = await this.searchMany(ids);
    found.forEach((stored) => this.rulesById.delete(stored.id));
    return found;
  }

  async updateStatusMany(ids: number[], active: boolean): Promise<StoredRule[]> {
    const found = await this.searchMany(ids);
    found.forEach(({ rule }) => (active ? rule.activate() : rule.deactivate()));
    return found;
  }

  async findAll(type?: RuleType): Promise<StoredRule[]> {
    const all = Array.from(this.rulesById.values());
    return type ? all.filter((stored) => stored.rule.type === type) : all;
  }
}
