import { Request, Response } from 'express';
import { RuleRepository } from '../../../application/ports/RuleRepository';
import { addRules } from '../../../application/useCases/addRules';
import { removeRules } from '../../../application/useCases/removeRules';
import { updateRuleStatus } from '../../../application/useCases/updateRuleStatus';
import { getRules } from '../../../application/useCases/getRules';
import { RuleType } from '../../../domain/rules/RuleTypes';
import { AddRuleRequest, RemoveRulesRequest, UpdateStatusRequest } from '../http/Validation';

export class FirewallController {
  constructor(private repository: RuleRepository) {}

  addRule = (type: RuleType) => async (req: Request, res: Response): Promise<void> => {
    const { values, mode } = req.body as AddRuleRequest;

    const added = await addRules(this.repository, type, values, mode);

    res.status(201).json({
      type,
      mode,
      values: added.map(({ id, rule }) => ({ id, value: rule.value, active: rule.active })),
      status: 'success',
    });
  };

  removeRules = async (req: Request, res: Response): Promise<void> => {
    const { ids } = req.body as RemoveRulesRequest;

    const removed = await removeRules(this.repository, ids);

    res.status(200).json({
      removed: removed.map(({ id, rule, mode }) => ({
        id,
        type: rule.type,
        mode,
        value: rule.value,
        active: rule.active,
      })),
      status: 'success',
    });
  };

  getRules = async (req: Request, res: Response): Promise<void> => {
    const type = req.query.type as RuleType | undefined;

    res.status(200).json(await getRules(this.repository, type));
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    const { ids, active } = req.body as UpdateStatusRequest;

    const updated = await updateRuleStatus(this.repository, ids, active);

    res.status(200).json({
      updated: updated.map(({ id, rule, mode }) => ({
        id,
        type: rule.type,
        mode,
        value: rule.value,
        active: rule.active,
      })),
      status: 'success',
    });
  };
}
