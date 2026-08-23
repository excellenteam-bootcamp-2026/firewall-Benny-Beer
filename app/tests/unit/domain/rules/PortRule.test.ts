import { PortRule } from '../../../../src/domain/rules/PortRule';
import { InvalidRuleValueError } from '../../../../src/domain/rules/errors';

describe('PortRule.create', () => {
  test('builds a rule for a valid port, active by default', () => {
    const rule = PortRule.create('8080');

    expect(rule.value).toBe(8080);
    expect(rule.type).toBe('port');
    expect(rule.active).toBe(true);
  });

  test('honors an explicit active flag', () => {
    expect(PortRule.create(443, false).active).toBe(false);
  });

  test('rejects an out-of-range port', () => {
    expect(() => PortRule.create(70000)).toThrow(InvalidRuleValueError);
  });
});
