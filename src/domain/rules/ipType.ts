import { InvalidRuleValueError } from './errors';

export type IP = string & { readonly __brand: 'IP' };

export function createIP(value: string | number): IP {
  if (typeof value !== 'string' || !isValidIPv4(value)) {
    throw new InvalidRuleValueError('INVALID_IP', `Invalid IPv4 address: ${value}`);
  }
  return value as IP;
}

/**
 * Validates that a string is a well-formed IPv4 address.
 * Each octet must be a number 0-255, no leading zeros (e.g. "01" is invalid),
 * exactly 4 octets, no extra characters.
 */
export function isValidIPv4(value: string): boolean {
  const octets = value.split('.');

  if (octets.length !== 4) {
    return false;
  }

  return octets.every((octet) => {
    // Reject empty, non-digit chars, or leading zeros like "01"
    if (!/^\d{1,3}$/.test(octet)) {
      return false;
    }
    if (octet.length > 1 && octet.startsWith('0')) {
      return false;
    }

    const num = Number(octet);
    return num >= 0 && num <= 255;
  });
}