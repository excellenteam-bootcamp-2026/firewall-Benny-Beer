import { Rule } from '../../domain/rules/Rule';
import { RuleMode, RuleType } from '../../domain/rules/RuleTypes';

export interface StoredRule {
  id: number;
  rule: Rule;
  mode: RuleMode;
}

export interface RuleRepository {
  add(rule: Rule, mode: RuleMode): Promise<number>;
  search(id: number): Promise<StoredRule | undefined>;
  searchMany(ids: number[]): Promise<StoredRule[]>;
  delete(id: number): Promise<StoredRule | undefined>;
  deleteMany(ids: number[]): Promise<StoredRule[]>;
  updateStatusMany(ids: number[], active: boolean): Promise<StoredRule[]>;
  findAll(type?: RuleType): Promise<StoredRule[]>;
}
