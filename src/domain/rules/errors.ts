export class InvalidRuleValueError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'InvalidRuleValueError';
  }
}
