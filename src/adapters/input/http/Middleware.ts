import { Request, Response, NextFunction } from 'express';
import {
  validateAddRuleRequest,
  validateRemoveRulesRequest,
  validateUpdateStatusRequest,
  validateGetRulesQuery,
} from './Validation';

export function validateAddRule(req: Request, _res: Response, next: NextFunction): void {
  try {
    req.body = validateAddRuleRequest(req.body);
    next();
  } catch (err) {
    next(err);
  }
}

export function validateRemoveRules(req: Request, _res: Response, next: NextFunction): void {
  try {
    req.body = validateRemoveRulesRequest(req.body);
    next();
  } catch (err) {
    next(err);
  }
}

export function validateUpdateStatus(req: Request, _res: Response, next: NextFunction): void {
  try {
    req.body = validateUpdateStatusRequest(req.body);
    next();
  } catch (err) {
    next(err);
  }
}

export function validateGetRules(req: Request, _res: Response, next: NextFunction): void {
  try {
    validateGetRulesQuery(req.query.type);
    next();
  } catch (err) {
    next(err);
  }
}
