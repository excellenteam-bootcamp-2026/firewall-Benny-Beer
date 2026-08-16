import { InvalidRuleValueError } from './errors';

export type Port = string & { readonly __brand: 'Port' };

export function createPort(value: string): Port {
  if (!isValidPort(value)) {
    throw new InvalidRuleValueError(
      'INVALID_PORT',
      'Ports must be integers between 1 and 65535.',
    );
  }
  return value as Port;
}

export function isValidPort(value: string): boolean {
  if (!/^\d+$/.test(value)) {
    return false;
  }

  const number = Number(value);
  return number >= 1 && number <= 65535;
}