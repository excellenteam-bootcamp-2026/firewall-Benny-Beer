import { Rule } from './Rule';
import { RuleType } from './RuleTypes';
import { createPort } from './portType';

export class PortRule extends Rule {
  readonly type: RuleType = 'port';

  private constructor(value: string, active?: boolean) {
    super(value, active);
  }

  static create(rawValue: string, active?: boolean): PortRule {
    const port = createPort(rawValue); // throws if invalid
    return new PortRule(port.toString(), active);
  }
}

Rule.register('port', PortRule);