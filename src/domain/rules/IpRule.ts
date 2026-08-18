import { Rule } from './Rule';
import { RuleType } from './RuleTypes';
import { createIP } from './ipType';

export class IpRule extends Rule {
  readonly type: RuleType = 'ip';

  private constructor(value: string, active?: boolean) {
    super(value, active);
  }

  static create(rawValue: string | number, active?: boolean): IpRule {
    const ip = createIP(rawValue); // throws if invalid
    return new IpRule(ip.toString(), active);
  }
}

Rule.register('ip', IpRule);