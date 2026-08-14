import { Rule } from '../../domain/rules/Rule';
import { RuleMode } from '../../domain/rules/RuleTypes';

export interface RuleRepository {
  add(rule: Rule, mode: RuleMode): number;
}