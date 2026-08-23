import { InvalidRequestError } from './Errors';
import { RuleMode, RuleType, RULE_TYPES } from '../../../domain/rules';

export interface AddRuleRequest {
  values: (string | number)[];
  mode: RuleMode;
}

export interface RemoveRulesRequest {
  ids: number[];
}

export interface UpdateStatusRequest {
  ids: number[];
  active: boolean;
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

  return { values: values as (string | number)[], mode };
}

function validateIds(ids: unknown): number[] {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new InvalidRequestError('ids must be a non-empty array.');
  }
  if (!ids.every((id) => typeof id === 'number' && Number.isInteger(id))) {
    throw new InvalidRequestError('ids must contain only integers.');
  }
  return ids;
}

export function validateRemoveRulesRequest(body: unknown): RemoveRulesRequest {
  if (typeof body !== 'object' || body === null) {
    throw new InvalidRequestError('Request body must be an object.');
  }

  const { ids } = body as Record<string, unknown>;

  return { ids: validateIds(ids) };
}

export function validateUpdateStatusRequest(body: unknown): UpdateStatusRequest {
  if (typeof body !== 'object' || body === null) {
    throw new InvalidRequestError('Request body must be an object.');
  }

  const { ids, active } = body as Record<string, unknown>;

  if (typeof active !== 'boolean') {
    throw new InvalidRequestError('active must be a boolean.');
  }

  return { ids: validateIds(ids), active };
}

export function validateGetRulesQuery(query: unknown): RuleType | undefined {
  if (query === undefined) {
    return undefined;
  }
  if (typeof query !== 'string' || !RULE_TYPES.includes(query as RuleType)) {
    throw new InvalidRequestError('type must be one of "ip", "domain", or "port".');
  }
  return query as RuleType;
}
