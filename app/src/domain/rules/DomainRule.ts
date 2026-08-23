import { Rule } from './Rule';
import { RuleType } from './RuleTypes';
import { createDomain } from './DomainsType';

export class DomainRule extends Rule {
  readonly type: RuleType = 'domain';

  private constructor(value: string, active?: boolean) {
    super(value, active);
  }

  static create(rawValue: string | number, active?: boolean): DomainRule {
    const domain = createDomain(rawValue); // throws if invalid
    return new DomainRule(domain.toString(), active);
  }
}

Rule.register('domain', DomainRule);