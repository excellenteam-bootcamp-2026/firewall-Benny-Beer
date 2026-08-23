import { InvalidRuleValueError } from './errors';

export type Port = number & { readonly __brand: 'Port' };

export function createPort(value: string | number): Port {
  if (!isValidPort(value)) {
    throw new InvalidRuleValueError(
      'INVALID_PORT',
      'Ports must be integers between 1 and 65535.',
    );
  }
  return Number(value) as Port;
}

export function isValidPort(value: string | number): boolean {
  if (typeof value === 'number') {
    return Number.isInteger(value) && value >= 1 && value <= 65535;
  }

  if (!/^\d+$/.test(value)) {
    return false;
  }

  const number = Number(value);
  return number >= 1 && number <= 65535;
}