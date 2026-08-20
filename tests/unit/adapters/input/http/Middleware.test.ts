import type { Request, Response } from 'express';
import {
  validateAddRule,
  validateRemoveRules,
  validateUpdateStatus,
  validateGetRules,
} from '../../../../../src/adapters/input/http/Middleware';
import { InvalidRequestError } from '../../../../../src/adapters/input/http/Errors';

describe('validateAddRule', () => {
  test('replaces req.body with the validated shape and calls next() with no error', () => {
    const req = { body: { values: ['1.1.1.1'], mode: 'blacklist' } } as Request;
    const next = jest.fn();

    validateAddRule(req, {} as Response, next);

    expect(req.body).toEqual({ values: ['1.1.1.1'], mode: 'blacklist' });
    expect(next).toHaveBeenCalledWith();
  });

  test('forwards the InvalidRequestError to next() on a malformed body', () => {
    const req = { body: { values: [], mode: 'blacklist' } } as unknown as Request;
    const next = jest.fn();

    validateAddRule(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(InvalidRequestError));
  });
});

describe('validateRemoveRules', () => {
  test('replaces req.body and calls next() with no error', () => {
    const req = { body: { ids: [1, 2] } } as unknown as Request;
    const next = jest.fn();

    validateRemoveRules(req, {} as Response, next);

    expect(req.body).toEqual({ ids: [1, 2] });
    expect(next).toHaveBeenCalledWith();
  });

  test('forwards the error on invalid ids', () => {
    const req = { body: { ids: [] } } as unknown as Request;
    const next = jest.fn();

    validateRemoveRules(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(InvalidRequestError));
  });
});

describe('validateUpdateStatus', () => {
  test('replaces req.body and calls next() with no error', () => {
    const req = { body: { ids: [1], active: true } } as unknown as Request;
    const next = jest.fn();

    validateUpdateStatus(req, {} as Response, next);

    expect(req.body).toEqual({ ids: [1], active: true });
    expect(next).toHaveBeenCalledWith();
  });

  test('forwards the error on a non-boolean active flag', () => {
    const req = { body: { ids: [1], active: 'yes' } } as unknown as Request;
    const next = jest.fn();

    validateUpdateStatus(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(InvalidRequestError));
  });
});

describe('validateGetRules', () => {
  test('calls next() with no error for a supported type', () => {
    const req = { query: { type: 'ip' } } as unknown as Request;
    const next = jest.fn();

    validateGetRules(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith();
  });

  test('forwards the error for an unsupported type', () => {
    const req = { query: { type: 'mac' } } as unknown as Request;
    const next = jest.fn();

    validateGetRules(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(InvalidRequestError));
  });
});
