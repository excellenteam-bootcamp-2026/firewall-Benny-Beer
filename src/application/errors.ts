export class RuleNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RuleNotFoundError';
  }
}
