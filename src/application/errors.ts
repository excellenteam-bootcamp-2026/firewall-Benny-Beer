export class RuleNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RuleNotFoundError';
  }
}

export class DuplicateRuleError extends Error {
  readonly code = 'DUPLICATE_RULE';

  constructor(message: string) {
    super(message);
    this.name = 'DuplicateRuleError';
  }
}
