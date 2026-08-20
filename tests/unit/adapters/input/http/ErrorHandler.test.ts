import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import { errorHandler } from '../../../../../src/adapters/input/http/ErrorHandler';
import { InvalidRequestError } from '../../../../../src/adapters/input/http/Errors';
import { InvalidRuleValueError } from '../../../../../src/domain/rules';
import { RuleNotFoundError, DuplicateRuleError } from '../../../../../src/application/errors';

function invoke(err: unknown): { status: number | undefined; body: unknown } {
  const state: { status?: number; body?: unknown } = {};
  const res = {
    status(code: number) {
      state.status = code;
      return this;
    },
    json(body: unknown) {
      state.body = body;
      return this;
    },
  } as unknown as Response;

  errorHandler(err, {} as Request, res, () => undefined);
  return { status: state.status, body: state.body };
}

test('maps InvalidRequestError to 400 INVALID_REQUEST', () => {
  const { status, body } = invoke(new InvalidRequestError('bad shape'));
  assert.equal(status, 400);
  assert.deepEqual(body, { status: 'error', code: 'INVALID_REQUEST', message: 'bad shape' });
});

test('maps InvalidRuleValueError to 400 with its own code', () => {
  const { status, body } = invoke(new InvalidRuleValueError('INVALID_IP', 'Invalid IPv4 address: x'));
  assert.equal(status, 400);
  assert.deepEqual(body, { status: 'error', code: 'INVALID_IP', message: 'Invalid IPv4 address: x' });
});

test('maps RuleNotFoundError to 404 RULE_NOT_FOUND', () => {
  const { status, body } = invoke(new RuleNotFoundError('Rule id(s) not found: 1'));
  assert.equal(status, 404);
  assert.deepEqual(body, { status: 'error', code: 'RULE_NOT_FOUND', message: 'Rule id(s) not found: 1' });
});

test('maps DuplicateRuleError to 409 DUPLICATE_RULE', () => {
  const { status, body } = invoke(new DuplicateRuleError('Rule value(s) already exist: 1.1.1.1'));
  assert.equal(status, 409);
  assert.deepEqual(body, {
    status: 'error',
    code: 'DUPLICATE_RULE',
    message: 'Rule value(s) already exist: 1.1.1.1',
  });
});

test('maps a body-parser entity.too.large error to 413 PAYLOAD_TOO_LARGE', () => {
  const err = Object.assign(new Error('request entity too large'), { status: 413, type: 'entity.too.large' });
  const { status, body } = invoke(err);
  assert.equal(status, 413);
  assert.deepEqual(body, {
    status: 'error',
    code: 'PAYLOAD_TOO_LARGE',
    message: 'request entity too large',
  });
});

test('maps a body-parser encoding.unsupported error to 415 UNSUPPORTED_MEDIA_TYPE', () => {
  const err = Object.assign(new Error('unsupported encoding'), { status: 415, type: 'encoding.unsupported' });
  const { status, body } = invoke(err);
  assert.equal(status, 415);
  assert.deepEqual(body, {
    status: 'error',
    code: 'UNSUPPORTED_MEDIA_TYPE',
    message: 'unsupported encoding',
  });
});

test('maps a malformed-JSON body-parser error to 400 INVALID_REQUEST', () => {
  const err = Object.assign(new SyntaxError('Unexpected token'), { status: 400, type: 'entity.parse.failed' });
  const { status, body } = invoke(err);
  assert.equal(status, 400);
  assert.deepEqual(body, {
    status: 'error',
    code: 'INVALID_REQUEST',
    message: 'Unexpected token',
  });
});

test('falls back to 500 INTERNAL_ERROR for unrecognized errors', () => {
  const originalConsoleError = console.error;
  console.error = () => undefined;
  try {
    const { status, body } = invoke(new Error('boom'));
    assert.equal(status, 500);
    assert.deepEqual(body, {
      status: 'error',
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred.',
    });
  } finally {
    console.error = originalConsoleError;
  }
});
