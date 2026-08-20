import type { Request, Response } from 'express';
import { errorHandler } from '../../../../../src/adapters/input/http/ErrorHandler';
import { InvalidRequestError } from '../../../../../src/adapters/input/http/Errors';
import { InvalidRuleValueError } from '../../../../../src/domain/rules';
import { RuleNotFoundError, DuplicateRuleError } from '../../../../../src/application/errors';

function invoke(err: unknown): { status: number; body: unknown } {
  const json = jest.fn();
  const res = { status: jest.fn().mockReturnValue({ json }) } as unknown as Response;

  errorHandler(err, {} as Request, res, jest.fn());

  return { status: (res.status as jest.Mock).mock.calls[0][0], body: json.mock.calls[0][0] };
}

describe('errorHandler', () => {
  test('maps InvalidRequestError to 400 INVALID_REQUEST', () => {
    const { status, body } = invoke(new InvalidRequestError('bad shape'));
    expect(status).toBe(400);
    expect(body).toEqual({ status: 'error', code: 'INVALID_REQUEST', message: 'bad shape' });
  });

  test('maps InvalidRuleValueError to 400 with its own code', () => {
    const { status, body } = invoke(new InvalidRuleValueError('INVALID_IP', 'Invalid IPv4 address: x'));
    expect(status).toBe(400);
    expect(body).toEqual({ status: 'error', code: 'INVALID_IP', message: 'Invalid IPv4 address: x' });
  });

  test('maps RuleNotFoundError to 404 RULE_NOT_FOUND', () => {
    const { status, body } = invoke(new RuleNotFoundError('Rule id(s) not found: 1'));
    expect(status).toBe(404);
    expect(body).toEqual({ status: 'error', code: 'RULE_NOT_FOUND', message: 'Rule id(s) not found: 1' });
  });

  test('maps DuplicateRuleError to 409 DUPLICATE_RULE', () => {
    const { status, body } = invoke(new DuplicateRuleError('Rule value(s) already exist: 1.1.1.1'));
    expect(status).toBe(409);
    expect(body).toEqual({
      status: 'error',
      code: 'DUPLICATE_RULE',
      message: 'Rule value(s) already exist: 1.1.1.1',
    });
  });

  test('maps a body-parser entity.parse.failed error to 400 INVALID_REQUEST', () => {
    const err = Object.assign(new SyntaxError('Unexpected token'), {
      status: 400,
      type: 'entity.parse.failed',
    });
    const { status, body } = invoke(err);
    expect(status).toBe(400);
    expect(body).toEqual({ status: 'error', code: 'INVALID_REQUEST', message: 'Unexpected token' });
  });

  test('maps a body-parser entity.too.large error to 413 PAYLOAD_TOO_LARGE', () => {
    const err = Object.assign(new Error('request entity too large'), {
      status: 413,
      type: 'entity.too.large',
    });
    const { status, body } = invoke(err);
    expect(status).toBe(413);
    expect(body).toEqual({
      status: 'error',
      code: 'PAYLOAD_TOO_LARGE',
      message: 'request entity too large',
    });
  });

  test('maps a body-parser encoding.unsupported error to 415 UNSUPPORTED_MEDIA_TYPE', () => {
    const err = Object.assign(new Error('unsupported encoding'), {
      status: 415,
      type: 'encoding.unsupported',
    });
    const { status, body } = invoke(err);
    expect(status).toBe(415);
    expect(body).toEqual({
      status: 'error',
      code: 'UNSUPPORTED_MEDIA_TYPE',
      message: 'unsupported encoding',
    });
  });

  test('falls back to a default message when a body-parser error carries none', () => {
    const err = Object.assign(new Error(), {
      status: 400,
      type: 'entity.parse.failed',
      message: undefined,
    });
    const { body } = invoke(err);
    expect((body as { message: string }).message).toBe('Invalid request body.');
  });

  test('falls back to a generic INVALID_REQUEST code for an unmapped body-parser error type', () => {
    const err = Object.assign(new Error('weird'), { status: 422, type: 'some.other.type' });
    const { status, body } = invoke(err);
    expect(status).toBe(422);
    expect(body).toEqual({ status: 'error', code: 'INVALID_REQUEST', message: 'weird' });
  });

  // No genuine unexpected error reaches this handler over live HTTP against a
  // healthy DB — exercised directly to cover the fallback branch.
  test('falls back to 500 INTERNAL_ERROR for an unrecognized error', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      const { status, body } = invoke(new Error('boom'));
      expect(status).toBe(500);
      expect(body).toEqual({
        status: 'error',
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred.',
      });
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });
});
