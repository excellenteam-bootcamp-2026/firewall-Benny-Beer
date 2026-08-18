import { Request, Response, NextFunction } from 'express';
import { InvalidRequestError } from './Errors';
import { InvalidRuleValueError } from '../../../domain/rules';
import { RuleNotFoundError } from '../../../application/errors';

const BODY_PARSER_ERROR_CODES: Record<string, string> = {
  'entity.parse.failed': 'INVALID_REQUEST',
  'entity.too.large': 'PAYLOAD_TOO_LARGE',
  'encoding.unsupported': 'UNSUPPORTED_MEDIA_TYPE',
};

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

  const bodyParserErr = err as { status?: number; type?: string; message?: string };
  if (typeof bodyParserErr.status === 'number' && bodyParserErr.status < 500 && bodyParserErr.type) {
    res.status(bodyParserErr.status).json({
      status: 'error',
      code: BODY_PARSER_ERROR_CODES[bodyParserErr.type] ?? 'INVALID_REQUEST',
      message: bodyParserErr.message ?? 'Invalid request body.',
    });
    return;
  }

  console.error(err);
  res.status(500).json({
    status: 'error',
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred.',
  });
}
