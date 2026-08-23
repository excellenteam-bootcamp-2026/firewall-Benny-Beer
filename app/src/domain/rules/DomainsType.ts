import { InvalidRuleValueError } from './errors';

export type Domain = string & { readonly __brand: 'Domain' };

export function createDomain(value: string | number): Domain {
  if (typeof value !== 'string' || !isValidDomain(value)) {
    throw new InvalidRuleValueError('INVALID_DOMAIN', `Invalid domain: ${value}`);
  }
  return value.toLowerCase() as Domain;
}

/**
 * Validates that a string is a bare domain name — no protocol, path, query,
 * or port. Must have at least one dot (a TLD) and each label must follow
 * DNS label rules.
 */
export function isValidDomain(value: string): boolean {
  // Reject protocol, path, query, or fragment outright — a bare domain
  // should contain none of these characters.
  if (/[:/?#]/.test(value)) {
    return false;
  }

  const labels = value.split('.');

  // Needs at least "name.tld" — 2+ labels
  if (labels.length < 2) {
    return false;
  }

  const labelPattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;

  return labels.every((label) => labelPattern.test(label));
}

