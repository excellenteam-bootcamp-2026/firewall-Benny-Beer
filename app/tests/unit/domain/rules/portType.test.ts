import { createPort, isValidPort } from '../../../../src/domain/rules/portType';
import { InvalidRuleValueError } from '../../../../src/domain/rules/errors';

describe('isValidPort', () => {
  test('accepts the inclusive boundaries 1 and 65535', () => {
    expect(isValidPort(1)).toBe(true);
    expect(isValidPort(65535)).toBe(true);
    expect(isValidPort('1')).toBe(true);
    expect(isValidPort('65535')).toBe(true);
  });

  test('rejects 0 and values above 65535', () => {
    expect(isValidPort(0)).toBe(false);
    expect(isValidPort(65536)).toBe(false);
  });

  test('rejects negative numbers', () => {
    expect(isValidPort(-1)).toBe(false);
    expect(isValidPort('-1')).toBe(false);
  });

  test('rejects non-integer numbers', () => {
    expect(isValidPort(8080.5)).toBe(false);
  });

  test('rejects non-numeric strings', () => {
    expect(isValidPort('abc')).toBe(false);
    expect(isValidPort('80.5')).toBe(false);
    expect(isValidPort('+80')).toBe(false);
  });
});

describe('createPort', () => {
  test('returns the numeric value for a valid port given as a string or number', () => {
    expect(createPort('8080')).toBe(8080);
    expect(createPort(443)).toBe(443);
  });

  test('throws InvalidRuleValueError with code INVALID_PORT for an out-of-range port', () => {
    try {
      createPort(70000);
      throw new Error('expected createPort to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidRuleValueError);
      expect((err as InvalidRuleValueError).code).toBe('INVALID_PORT');
    }
  });
});
