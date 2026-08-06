import { Request, Response } from 'express';
import { IFirewallService } from '../../../core/ports/input/IFirewallService';
import { RuleMode, RuleType } from '../../../core/domain/FirewallRule';

type AppError = Error & { code?: string; status?: number };

function errorResponse(res: Response, status: number, code: string, message: string): void {
  res.status(status).json({ status: 'error', code, message });
}

function isValidMode(mode: unknown): mode is RuleMode {
  return mode === 'blacklist' || mode === 'whitelist';
}

function isNonEmptyArray(val: unknown): val is unknown[] {
  return Array.isArray(val) && val.length > 0;
}

function isValidIPv4(ip: unknown): ip is string {
  if (typeof ip !== 'string') return false;
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    const n = Number(p);
    return /^\d+$/.test(p) && n >= 0 && n <= 255;
  });
}

function isValidDomain(domain: unknown): domain is string {
  if (typeof domain !== 'string') return false;
  return !domain.includes('://') && !domain.includes('/') && !/:\d+$/.test(domain);
}

function isValidPort(port: unknown): port is number {
  return Number.isInteger(port) && (port as number) >= 1 && (port as number) <= 65535;
}

function isIntegerArray(arr: unknown[]): arr is number[] {
  return arr.every(Number.isInteger);
}

export class FirewallController {
  constructor(private readonly service: IFirewallService) {}

  addIps = (req: Request, res: Response): void => {
    const { values, mode } = req.body;
    if (!isNonEmptyArray(values)) {
      errorResponse(res, 400, 'INVALID_VALUES', 'values must be a non-empty array.');
      return;
    }
    if (!isValidMode(mode)) {
      errorResponse(res, 400, 'INVALID_MODE', 'mode must be blacklist or whitelist.');
      return;
    }
    const invalid = values.find((v) => !isValidIPv4(v));
    if (invalid !== undefined) {
      errorResponse(res, 400, 'INVALID_IP', `Invalid IPv4 address: ${invalid}`);
      return;
    }
    const added = this.service.addRules(values as string[], 'ip', mode);
    res.status(201).json({ type: 'ip', mode, values: added.map(({ id, value, active }) => ({ id, value, active })), status: 'success' });
  };

  addDomains = (req: Request, res: Response): void => {
    const { values, mode } = req.body;
    if (!isNonEmptyArray(values)) {
      errorResponse(res, 400, 'INVALID_VALUES', 'values must be a non-empty array.');
      return;
    }
    if (!isValidMode(mode)) {
      errorResponse(res, 400, 'INVALID_MODE', 'mode must be blacklist or whitelist.');
      return;
    }
    const invalid = values.find((v) => !isValidDomain(v));
    if (invalid !== undefined) {
      errorResponse(res, 400, 'INVALID_DOMAIN', `Invalid domain (must not include protocol, path, or port): ${invalid}`);
      return;
    }
    const added = this.service.addRules(values as string[], 'domain', mode);
    res.status(201).json({ type: 'domain', mode, values: added.map(({ id, value, active }) => ({ id, value, active })), status: 'success' });
  };

  addPorts = (req: Request, res: Response): void => {
    const { values, mode } = req.body;
    if (!isNonEmptyArray(values)) {
      errorResponse(res, 400, 'INVALID_VALUES', 'values must be a non-empty array.');
      return;
    }
    if (!isValidMode(mode)) {
      errorResponse(res, 400, 'INVALID_MODE', 'mode must be blacklist or whitelist.');
      return;
    }
    const invalid = values.find((v) => !isValidPort(v));
    if (invalid !== undefined) {
      errorResponse(res, 400, 'INVALID_PORT', 'Ports must be integers between 1 and 65535.');
      return;
    }
    const added = this.service.addRules(values as number[], 'port', mode);
    res.status(201).json({ type: 'port', mode, values: added.map(({ id, value, active }) => ({ id, value, active })), status: 'success' });
  };

  removeRules = (req: Request, res: Response): void => {
    const { ids } = req.body;
    if (!isNonEmptyArray(ids) || !isIntegerArray(ids)) {
      errorResponse(res, 400, 'INVALID_IDS', 'ids must be a non-empty array of integers.');
      return;
    }
    try {
      const removed = this.service.removeRules(ids);
      res.status(200).json({ removed, status: 'success' });
    } catch (err) {
      const e = err as AppError;
      res.status(e.status ?? 500).json({ status: 'error', code: e.code ?? 'ERROR', message: e.message });
    }
  };

  getRules = (req: Request, res: Response): void => {
    const { type } = req.query;
    if (type !== undefined && type !== 'ip' && type !== 'domain' && type !== 'port') {
      errorResponse(res, 400, 'INVALID_TYPE', 'type query param must be ip, domain, or port.');
      return;
    }
    const result = this.service.getRules(type as RuleType | undefined);
    res.status(200).json(result);
  };

  updateStatus = (req: Request, res: Response): void => {
    const { ids, active } = req.body;
    if (!isNonEmptyArray(ids) || !isIntegerArray(ids)) {
      errorResponse(res, 400, 'INVALID_IDS', 'ids must be a non-empty array of integers.');
      return;
    }
    if (typeof active !== 'boolean') {
      errorResponse(res, 400, 'INVALID_ACTIVE', 'active must be a boolean.');
      return;
    }
    try {
      const updated = this.service.updateStatus(ids, active);
      res.status(200).json({ updated, status: 'success' });
    } catch (err) {
      const e = err as AppError;
      res.status(e.status ?? 500).json({ status: 'error', code: e.code ?? 'ERROR', message: e.message });
    }
  };
}
