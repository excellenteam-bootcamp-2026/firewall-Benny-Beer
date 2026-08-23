import { DomainRule } from '../../../../src/domain/rules/DomainRule';
import { InvalidRuleValueError } from '../../../../src/domain/rules/errors';

describe('DomainRule.create', () => {
  test('builds a rule for a valid domain, active by default', () => {
    const rule = DomainRule.create('Example.com');

    expect(rule.value).toBe('example.com');
    expect(rule.type).toBe('domain');
    expect(rule.active).toBe(true);
  });

  test('honors an explicit active flag', () => {
    expect(DomainRule.create('example.com', false).active).toBe(false);
  });

  test('rejects a malformed domain', () => {
    expect(() => DomainRule.create('https://example.com/path')).toThrow(InvalidRuleValueError);
  });
});
