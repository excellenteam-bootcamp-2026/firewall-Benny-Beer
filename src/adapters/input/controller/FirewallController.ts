import { Request, Response } from 'express';
import { RuleRepository } from '../../../application/ports/RuleRepository';
import { addRules } from '../../../application/useCases/addRules';
import { RuleType } from '../../../domain/rules/RuleTypes';
import { AddRuleRequest } from '../http/Validation';

export class FirewallController {
  constructor(private repository: RuleRepository) {}

  addRule = (type: RuleType) => (req: Request, res: Response): void => {
    const { values, mode } = req.body as AddRuleRequest;

    const added = addRules(this.repository, type, values, mode);

    res.status(201).json({
      type,
      mode,
      values: added.map(({ id, rule }) => ({ id, value: rule.value, active: rule.active })),
      status: 'success',
    });
  };
}