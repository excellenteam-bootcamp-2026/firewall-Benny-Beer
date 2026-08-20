import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IpRule } from '../../../../src/domain/rules/IpRule';
import { InvalidRuleValueError } from '../../../../src/domain/rules/errors';

test('IpRule.create builds a rule for a valid IPv4 address', () => {
  const rule = IpRule.create('192.168.1.1');

  assert.equal(rule.value, '192.168.1.1');
  assert.equal(rule.type, 'ip');
  assert.equal(rule.active, true);
});

test('IpRule.create rejects an invalid IPv4 address', () => {
  assert.throws(() => IpRule.create('999.999.999.999'), InvalidRuleValueError);
});
