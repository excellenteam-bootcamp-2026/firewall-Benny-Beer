import { createDomain, isValidDomain } from '../../../../src/domain/rules/DomainsType';
import { InvalidRuleValueError } from '../../../../src/domain/rules/errors';

describe('isValidDomain', () => {
  test('accepts a minimal two-label domain and a deeply nested one', () => {
    expect(isValidDomain('a.co')).toBe(true);
    expect(isValidDomain('a.b.c.example.com')).toBe(true);
  });

  test('accepts internal hyphens in a label', () => {
    expect(isValidDomain('my-site.com')).toBe(true);
  });

  test('accepts the maximum 63-character label', () => {
    expect(isValidDomain(`${'a'.repeat(63)}.com`)).toBe(true);
  });

  test('rejects a label over 63 characters', () => {
    expect(isValidDomain(`${'a'.repeat(64)}.com`)).toBe(false);
  });

  test('rejects protocol, path, query, or fragment characters', () => {
    expect(isValidDomain('https://example.com')).toBe(false);
    expect(isValidDomain('example.com/path')).toBe(false);
    expect(isValidDomain('example.com?q=1')).toBe(false);
    expect(isValidDomain('example.com#frag')).toBe(false);
  });

  test('rejects a single label with no TLD', () => {
    expect(isValidDomain('localhost')).toBe(false);
  });

  test('rejects a label starting or ending with a hyphen', () => {
    expect(isValidDomain('-bad.com')).toBe(false);
    expect(isValidDomain('bad-.com')).toBe(false);
  });
});

describe('createDomain', () => {
  test('lower-cases the returned value', () => {
    expect(createDomain('Example.COM')).toBe('example.com');
  });

  test('throws InvalidRuleValueError with code INVALID_DOMAIN for a malformed domain', () => {
    try {
      createDomain('https://example.com/path');
      throw new Error('expected createDomain to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidRuleValueError);
      expect((err as InvalidRuleValueError).code).toBe('INVALID_DOMAIN');
    }
  });

  test('throws InvalidRuleValueError for a non-string value', () => {
    expect(() => createDomain(123 as unknown as string)).toThrow(InvalidRuleValueError);
  });
});
