import { Request, Response, NextFunction } from 'express';
import { InvalidRequestError } from './Errors';
import { InvalidRuleValueError } from '../../../domain/rules';
import { RuleNotFoundError } from '../../../application/errors';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof InvalidRequestError) {
    res.status(400).json({ status: 'error', code: 'INVALID_REQUEST', message: err.message });
    return;
  }

  if (err instanceof InvalidRuleValueError) {
    res.status(400).json({ status: 'error', code: err.code, message: err.message });
    return;
  }

  if (err instanceof RuleNotFoundError) {
    res.status(404).json({ status: 'error', code: 'RULE_NOT_FOUND', message: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({
    status: 'error',
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred.',
  });
}
