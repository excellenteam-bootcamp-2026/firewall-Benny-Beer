import { InvalidRequestError } from './Errors';
import { RuleMode } from '../../../domain/rules';

export interface AddRuleRequest {
  values: string[];
  mode: RuleMode;
}

/**
 * Checks request shape only. Whether a value is a legal IP/domain/port is a
 * domain concern, enforced when the Rule is built.
 */
export function validateAddRuleRequest(body: unknown): AddRuleRequest {
  if (typeof body !== 'object' || body === null) {
    throw new InvalidRequestError('Request body must be an object.');
  }

  const { values, mode } = body as Record<string, unknown>;

  if (mode !== 'blacklist' && mode !== 'whitelist') {
    throw new InvalidRequestError('mode must be either "blacklist" or "whitelist".');
  }

  if (!Array.isArray(values) || values.length === 0) {
    throw new InvalidRequestError('values must be a non-empty array.');
  }

  if (!values.every((v) => typeof v === 'string' || typeof v === 'number')) {
    throw new InvalidRequestError('values must contain only strings or numbers.');
  }

  return { values: values.map(String), mode };
}
