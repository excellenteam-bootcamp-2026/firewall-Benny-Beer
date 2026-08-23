import { IpRule } from '../../../../src/domain/rules/IpRule';
import { InvalidRuleValueError } from '../../../../src/domain/rules/errors';

describe('IpRule.create', () => {
  test('builds a rule for a valid IPv4 address, active by default', () => {
    const rule = IpRule.create('192.168.1.1');

    expect(rule.value).toBe('192.168.1.1');
    expect(rule.type).toBe('ip');
    expect(rule.active).toBe(true);
  });

  test('honors an explicit active flag', () => {
    expect(IpRule.create('192.168.1.1', false).active).toBe(false);
  });

  test('rejects an invalid IPv4 address', () => {
    expect(() => IpRule.create('999.999.999.999')).toThrow(InvalidRuleValueError);
  });
});
