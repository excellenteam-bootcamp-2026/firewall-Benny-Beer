import { Rule } from './Rule';
import { RuleType } from './RuleTypes';
import { createPort } from './portType';

export class PortRule extends Rule {
  readonly type: RuleType = 'port';

  private constructor(value: number, active?: boolean) {
    super(value, active);
  }

  static create(rawValue: string | number, active?: boolean): PortRule {
    const port = createPort(rawValue); // throws if invalid
    return new PortRule(port, active);
  }
}

Rule.register('port', PortRule);