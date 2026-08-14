import { Request, Response, NextFunction } from 'express';
import { validateAddRuleRequest } from './Validation';

export function validateAddRule(req: Request, _res: Response, next: NextFunction): void {
  try {
    req.body = validateAddRuleRequest(req.body);
    next();
  } catch (err) {
    next(err);
  }
}
