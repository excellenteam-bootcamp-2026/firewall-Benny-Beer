import {
  validateAddRuleRequest,
  validateRemoveRulesRequest,
  validateUpdateStatusRequest,
  validateGetRulesQuery,
} from '../../../../../src/adapters/input/http/Validation';
import { InvalidRequestError } from '../../../../../src/adapters/input/http/Errors';

describe('validateAddRuleRequest', () => {
  test('accepts a well-formed body and preserves value types', () => {
    expect(validateAddRuleRequest({ values: ['1.1.1.1', 443], mode: 'blacklist' })).toEqual({
      values: ['1.1.1.1', 443],
      mode: 'blacklist',
    });
  });

  test('rejects a non-object body', () => {
    expect(() => validateAddRuleRequest(null)).toThrow(InvalidRequestError);
    expect(() => validateAddRuleRequest('nope')).toThrow(InvalidRequestError);
  });

  test('rejects an invalid mode', () => {
    expect(() => validateAddRuleRequest({ values: ['1.1.1.1'], mode: 'graylist' })).toThrow(
      InvalidRequestError,
    );
  });

  test('rejects an empty commands array', () => {
    expect(() => validateAddRuleRequest({ values: [], mode: 'blacklist' })).toThrow(InvalidRequestError);
  });

  test('rejects a non-array values field', () => {
    expect(() => validateAddRuleRequest({ values: 'nope', mode: 'blacklist' })).toThrow(InvalidRequestError);
  });

  test('rejects values containing non-string/number entries', () => {
    expect(() =>
      validateAddRuleRequest({ values: ['1.1.1.1', { bad: true }], mode: 'blacklist' }),
    ).toThrow(InvalidRequestError);
  });
});

describe('validateRemoveRulesRequest', () => {
  test('accepts a non-empty array of integers', () => {
    expect(validateRemoveRulesRequest({ ids: [1, 2, 3] })).toEqual({ ids: [1, 2, 3] });
  });

  test('rejects an empty commands array', () => {
    expect(() => validateRemoveRulesRequest({ ids: [] })).toThrow(InvalidRequestError);
  });

  test('rejects a non-array or non-integer entries', () => {
    expect(() => validateRemoveRulesRequest({ ids: 'nope' })).toThrow(InvalidRequestError);
    expect(() => validateRemoveRulesRequest({ ids: [1, 2.5] })).toThrow(InvalidRequestError);
  });

  test('rejects a non-object body', () => {
    expect(() => validateRemoveRulesRequest(null)).toThrow(InvalidRequestError);
  });
});

describe('validateUpdateStatusRequest', () => {
  test('accepts a boolean active flag', () => {
    expect(validateUpdateStatusRequest({ ids: [1], active: false })).toEqual({ ids: [1], active: false });
  });

  test('rejects a non-boolean active flag', () => {
    expect(() => validateUpdateStatusRequest({ ids: [1], active: 'false' })).toThrow(InvalidRequestError);
  });

  test('rejects a non-object body', () => {
    expect(() => validateUpdateStatusRequest(null)).toThrow(InvalidRequestError);
  });
});

describe('validateGetRulesQuery', () => {
  test('accepts undefined and each supported type', () => {
    expect(validateGetRulesQuery(undefined)).toBeUndefined();
    expect(validateGetRulesQuery('ip')).toBe('ip');
    expect(validateGetRulesQuery('domain')).toBe('domain');
    expect(validateGetRulesQuery('port')).toBe('port');
  });

  test('rejects an unsupported type', () => {
    expect(() => validateGetRulesQuery('mac')).toThrow(InvalidRequestError);
    expect(() => validateGetRulesQuery(123)).toThrow(InvalidRequestError);
  });
});
