import { createIP, isValidIPv4 } from '../../../../src/domain/rules/ipType';
import { InvalidRuleValueError } from '../../../../src/domain/rules/errors';

describe('isValidIPv4', () => {
  test('accepts well-formed addresses, including all-zero and all-max boundaries', () => {
    expect(isValidIPv4('0.0.0.0')).toBe(true);
    expect(isValidIPv4('255.255.255.255')).toBe(true);
    expect(isValidIPv4('192.168.1.1')).toBe(true);
  });

  test('rejects leading zeros in an octet', () => {
    expect(isValidIPv4('01.1.1.1')).toBe(false);
    expect(isValidIPv4('1.1.1.01')).toBe(false);
  });

  test('rejects the wrong octet count', () => {
    expect(isValidIPv4('1.1.1')).toBe(false);
    expect(isValidIPv4('1.1.1.1.1')).toBe(false);
  });

  test('rejects empty octets', () => {
    expect(isValidIPv4('1..1.1')).toBe(false);
    expect(isValidIPv4('.1.1.1')).toBe(false);
    expect(isValidIPv4('1.1.1.')).toBe(false);
  });

  test('rejects whitespace', () => {
    expect(isValidIPv4(' 1.1.1.1')).toBe(false);
    expect(isValidIPv4('1.1.1.1 ')).toBe(false);
  });

  test('rejects octets out of range', () => {
    expect(isValidIPv4('256.1.1.1')).toBe(false);
    expect(isValidIPv4('1.1.1.999')).toBe(false);
  });
});

describe('createIP', () => {
  test('returns the value for a valid address', () => {
    expect(createIP('0.0.0.0')).toBe('0.0.0.0');
  });

  test('throws InvalidRuleValueError with code INVALID_IP for a malformed address', () => {
    expect(() => createIP('01.1.1.1')).toThrow(InvalidRuleValueError);
    try {
      createIP('999.999.999.999');
      throw new Error('expected createIP to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidRuleValueError);
      expect((err as InvalidRuleValueError).code).toBe('INVALID_IP');
    }
  });

  test('throws InvalidRuleValueError for a non-string value', () => {
    expect(() => createIP(123 as unknown as string)).toThrow(InvalidRuleValueError);
  });
});
