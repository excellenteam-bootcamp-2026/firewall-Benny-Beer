import { Rule } from '../../domain/rules/Rule';
import { RuleMode, RuleType } from '../../domain/rules/RuleTypes';

export interface StoredRule {
  id: number;
  rule: Rule;
  mode: RuleMode;
}

export interface RuleRepository {
  add(rule: Rule, mode: RuleMode): number;
  search(id: number): StoredRule | undefined;
  delete(id: number): StoredRule | undefined;
  findAll(type?: RuleType): StoredRule[];
}