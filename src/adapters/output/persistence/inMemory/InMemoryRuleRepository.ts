import { Rule, RuleMode } from '../../../../domain/rules';
import { RuleRepository } from '../../../../application/ports/RuleRepository';

export interface StoredRule {
  id: number;
  rule: Rule;
}

export class InMemoryRuleRepository implements RuleRepository {
  private nextId = 1;

  private blackRules = new Map<number, Rule>();
  private whiteRules = new Map<number, Rule>();

  private mapFor(mode: RuleMode): Map<number, Rule> {
    return mode === 'blacklist' ? this.blackRules : this.whiteRules;
  }

  add(rule: Rule, mode: RuleMode): number {
    const id = this.nextId++;
    // for debug 
    console.trace('Call stack for POST /api/firewall/ips');
    this.mapFor(mode).set(id, rule);
    return id;
  }

  search(id: number): StoredRule | undefined {
    const fromBlack = this.blackRules.get(id);
    if (fromBlack) return { id, rule: fromBlack };

    const fromWhite = this.whiteRules.get(id);
    if (fromWhite) return { id, rule: fromWhite };

    return undefined;
  }

  delete(id: number): StoredRule | undefined {
    const found = this.search(id);
    if (!found) return undefined;

    this.blackRules.delete(id);
    this.whiteRules.delete(id);
    return found;
  }
}
