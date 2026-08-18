import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateAddRuleRequest,
  validateRemoveRulesRequest,
  validateUpdateStatusRequest,
  validateGetRulesQuery,
} from '../../../../../src/adapters/input/http/Validation';
import { InvalidRequestError } from '../../../../../src/adapters/input/http/Errors';

test('validateAddRuleRequest accepts a well-formed body and preserves value types', () => {
  const result = validateAddRuleRequest({ values: ['1.1.1.1', 443], mode: 'blacklist' });
  assert.deepEqual(result, { values: ['1.1.1.1', 443], mode: 'blacklist' });
});

test('validateAddRuleRequest rejects a non-object body', () => {
  assert.throws(() => validateAddRuleRequest(null), InvalidRequestError);
  assert.throws(() => validateAddRuleRequest('nope'), InvalidRequestError);
});

test('validateAddRuleRequest rejects an invalid mode', () => {
  assert.throws(() => validateAddRuleRequest({ values: ['1.1.1.1'], mode: 'graylist' }), InvalidRequestError);
});

test('validateAddRuleRequest rejects an empty or non-array values field', () => {
  assert.throws(() => validateAddRuleRequest({ values: [], mode: 'blacklist' }), InvalidRequestError);
  assert.throws(() => validateAddRuleRequest({ values: 'nope', mode: 'blacklist' }), InvalidRequestError);
});

test('validateAddRuleRequest rejects values containing non-string/number entries', () => {
  assert.throws(
    () => validateAddRuleRequest({ values: ['1.1.1.1', { bad: true }], mode: 'blacklist' }),
    InvalidRequestError,
  );
});

test('validateRemoveRulesRequest accepts a non-empty array of integers', () => {
  assert.deepEqual(validateRemoveRulesRequest({ ids: [1, 2, 3] }), { ids: [1, 2, 3] });
});

test('validateRemoveRulesRequest rejects an empty array, non-array, or non-integer entries', () => {
  assert.throws(() => validateRemoveRulesRequest({ ids: [] }), InvalidRequestError);
  assert.throws(() => validateRemoveRulesRequest({ ids: 'nope' }), InvalidRequestError);
  assert.throws(() => validateRemoveRulesRequest({ ids: [1, 2.5] }), InvalidRequestError);
});

test('validateUpdateStatusRequest accepts a boolean active flag', () => {
  assert.deepEqual(validateUpdateStatusRequest({ ids: [1], active: false }), { ids: [1], active: false });
});

test('validateUpdateStatusRequest rejects a non-boolean active flag', () => {
  assert.throws(() => validateUpdateStatusRequest({ ids: [1], active: 'false' }), InvalidRequestError);
});

test('validateGetRulesQuery accepts undefined and each supported type', () => {
  assert.equal(validateGetRulesQuery(undefined), undefined);
  assert.equal(validateGetRulesQuery('ip'), 'ip');
  assert.equal(validateGetRulesQuery('domain'), 'domain');
  assert.equal(validateGetRulesQuery('port'), 'port');
});

test('validateGetRulesQuery rejects an unsupported type', () => {
  assert.throws(() => validateGetRulesQuery('mac'), InvalidRequestError);
});
