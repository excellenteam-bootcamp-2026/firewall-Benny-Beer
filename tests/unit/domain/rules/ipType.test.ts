import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createIP, isValidIPv4 } from '../../../../src/domain/rules/ipType';
import { InvalidRuleValueError } from '../../../../src/domain/rules/errors';

test('isValidIPv4 accepts well-formed addresses', () => {
  assert.equal(isValidIPv4('255.255.255.255'), true);
  assert.equal(isValidIPv4('0.0.0.0'), true);
  assert.equal(isValidIPv4('192.168.1.1'), true);
});

test('isValidIPv4 rejects leading zeros in an octet', () => {
  assert.equal(isValidIPv4('01.1.1.1'), false);
  assert.equal(isValidIPv4('1.1.1.01'), false);
});

test('isValidIPv4 rejects the wrong octet count', () => {
  assert.equal(isValidIPv4('1.1.1'), false);
  assert.equal(isValidIPv4('1.1.1.1.1'), false);
});

test('isValidIPv4 rejects empty octets', () => {
  assert.equal(isValidIPv4('1..1.1'), false);
  assert.equal(isValidIPv4('.1.1.1'), false);
  assert.equal(isValidIPv4('1.1.1.'), false);
});

test('isValidIPv4 rejects whitespace', () => {
  assert.equal(isValidIPv4(' 1.1.1.1'), false);
  assert.equal(isValidIPv4('1.1.1.1 '), false);
  assert.equal(isValidIPv4('1. 1.1.1'), false);
});

test('isValidIPv4 rejects octets out of range', () => {
  assert.equal(isValidIPv4('256.1.1.1'), false);
  assert.equal(isValidIPv4('1.1.1.999'), false);
});

test('createIP returns the value for a valid address', () => {
  assert.equal(createIP('0.0.0.0'), '0.0.0.0');
});

test('createIP throws InvalidRuleValueError for a malformed address', () => {
  assert.throws(() => createIP('01.1.1.1'), InvalidRuleValueError);
});

test('createIP throws InvalidRuleValueError for a non-string value', () => {
  assert.throws(() => createIP(123 as unknown as string), InvalidRuleValueError);
});
