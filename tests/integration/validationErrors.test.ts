// DB-free HTTP-level coverage for the spec's validation/business-rule error paths.
// Every case here fails before the request reaches the repository (shape validation
// in Middleware.ts, or Rule.build's domain validation), so it needs no Postgres —
// same reasoning as errorHandling.test.ts.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import app from '../../src/main/app';

let server: Server;
let baseUrl: string;

before(async () => {
  server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const { port } = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${port}/api/firewall`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
});

async function request(method: string, path: string, body?: unknown) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

test('POST /ips with an invalid mode returns 400 INVALID_REQUEST', async () => {
  const { status, body } = await request('POST', '/ips', { values: ['1.1.1.1'], mode: 'graylist' });
  assert.equal(status, 400);
  assert.equal(body.status, 'error');
  assert.equal(body.code, 'INVALID_REQUEST');
});

test('POST /ips with an empty values array returns 400 INVALID_REQUEST', async () => {
  const { status, body } = await request('POST', '/ips', { values: [], mode: 'blacklist' });
  assert.equal(status, 400);
  assert.equal(body.code, 'INVALID_REQUEST');
});

test('DELETE /rules with non-integer ids returns 400 INVALID_REQUEST', async () => {
  const { status, body } = await request('DELETE', '/rules', { ids: [1.5] });
  assert.equal(status, 400);
  assert.equal(body.code, 'INVALID_REQUEST');
});

test('GET /rules with an unsupported type filter returns 400 INVALID_REQUEST', async () => {
  const { status, body } = await request('GET', '/rules?type=mac');
  assert.equal(status, 400);
  assert.equal(body.code, 'INVALID_REQUEST');
});

test('POST /ips with a malformed IPv4 address returns 400 INVALID_IP', async () => {
  const { status, body } = await request('POST', '/ips', { values: ['999.999.999.999'], mode: 'blacklist' });
  assert.equal(status, 400);
  assert.equal(body.code, 'INVALID_IP');
});

test('POST /domains with a full URL instead of a bare domain returns 400 INVALID_DOMAIN', async () => {
  const { status, body } = await request('POST', '/domains', { values: ['https://example.com/path'], mode: 'blacklist' });
  assert.equal(status, 400);
  assert.equal(body.code, 'INVALID_DOMAIN');
});

test('POST /ports with an out-of-range port returns 400 INVALID_PORT', async () => {
  const { status, body } = await request('POST', '/ports', { values: [70000], mode: 'blacklist' });
  assert.equal(status, 400);
  assert.equal(body.code, 'INVALID_PORT');
});

test('every error response follows the {status, code, message} shape', async () => {
  const { body } = await request('POST', '/ips', { values: ['bad'], mode: 'blacklist' });
  assert.equal(typeof body.status, 'string');
  assert.equal(typeof body.code, 'string');
  assert.equal(typeof body.message, 'string');
});
