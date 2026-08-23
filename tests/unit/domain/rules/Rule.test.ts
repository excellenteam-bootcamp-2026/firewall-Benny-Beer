import { Rule } from '../../../../src/domain/rules';

describe('Rule.build', () => {
  test('dispatches to the registered subclass for each known type', () => {
    expect(Rule.build('ip', '1.1.1.1').type).toBe('ip');
    expect(Rule.build('domain', 'example.com').type).toBe('domain');
    expect(Rule.build('port', 443).type).toBe('port');
  });

  test('defaults active to true and honors an explicit active flag', () => {
    expect(Rule.build('ip', '1.1.1.1').active).toBe(true);
    expect(Rule.build('ip', '1.1.1.1', false).active).toBe(false);
  });

  // The HTTP layer never passes anything but 'ip'/'domain'/'port' (validated
  // upstream), so this branch is otherwise unreachable — exercised directly here.
  test('throws for a type with no registered class', () => {
    expect(() => Rule.build('mac' as never, 'value')).toThrow('No Rule class registered for type "mac"');
  });
});
