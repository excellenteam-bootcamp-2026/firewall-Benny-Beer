import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import {
  validateAddRule,
  validateRemoveRules,
  validateUpdateStatus,
  validateGetRules,
} from '../../../../../src/adapters/input/http/Middleware';
import { InvalidRequestError } from '../../../../../src/adapters/input/http/Errors';

function nextSpy(): { next: (err?: unknown) => void; calls: unknown[] } {
  const calls: unknown[] = [];
  return { next: (err?: unknown) => calls.push(err), calls };
}

test('validateAddRule replaces req.body with the validated shape and calls next() with no error', () => {
  const req = { body: { values: ['1.1.1.1'], mode: 'blacklist' } } as Request;
  const { next, calls } = nextSpy();

  validateAddRule(req, {} as Response, next);

  assert.deepEqual(req.body, { values: ['1.1.1.1'], mode: 'blacklist' });
  assert.deepEqual(calls, [undefined]);
});

test('validateAddRule forwards the InvalidRequestError to next() on a malformed body', () => {
  const req = { body: { values: [], mode: 'blacklist' } } as unknown as Request;
  const { next, calls } = nextSpy();

  validateAddRule(req, {} as Response, next);

  assert.equal(calls.length, 1);
  assert.ok(calls[0] instanceof InvalidRequestError);
});

test('validateRemoveRules replaces req.body and calls next() with no error', () => {
  const req = { body: { ids: [1, 2] } } as unknown as Request;
  const { next, calls } = nextSpy();

  validateRemoveRules(req, {} as Response, next);

  assert.deepEqual(req.body, { ids: [1, 2] });
  assert.deepEqual(calls, [undefined]);
});

test('validateRemoveRules forwards the error on invalid ids', () => {
  const req = { body: { ids: [] } } as unknown as Request;
  const { next, calls } = nextSpy();

  validateRemoveRules(req, {} as Response, next);

  assert.ok(calls[0] instanceof InvalidRequestError);
});

test('validateUpdateStatus replaces req.body and calls next() with no error', () => {
  const req = { body: { ids: [1], active: true } } as unknown as Request;
  const { next, calls } = nextSpy();

  validateUpdateStatus(req, {} as Response, next);

  assert.deepEqual(req.body, { ids: [1], active: true });
  assert.deepEqual(calls, [undefined]);
});

test('validateUpdateStatus forwards the error on a non-boolean active flag', () => {
  const req = { body: { ids: [1], active: 'yes' } } as unknown as Request;
  const { next, calls } = nextSpy();

  validateUpdateStatus(req, {} as Response, next);

  assert.ok(calls[0] instanceof InvalidRequestError);
});

test('validateGetRules calls next() with no error for a supported type', () => {
  const req = { query: { type: 'ip' } } as unknown as Request;
  const { next, calls } = nextSpy();

  validateGetRules(req, {} as Response, next);

  assert.deepEqual(calls, [undefined]);
});

test('validateGetRules forwards the error for an unsupported type', () => {
  const req = { query: { type: 'mac' } } as unknown as Request;
  const { next, calls } = nextSpy();

  validateGetRules(req, {} as Response, next);

  assert.ok(calls[0] instanceof InvalidRequestError);
});
