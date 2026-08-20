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

test('POST with malformed JSON returns 400 INVALID_REQUEST', async () => {
  const res = await fetch(`${baseUrl}/ips`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{not valid json',
  });
  const json = await res.json();

  assert.equal(res.status, 400);
  assert.equal(json.code, 'INVALID_REQUEST');
});

test('POST with an oversized body returns 413 PAYLOAD_TOO_LARGE', async () => {
  const res = await fetch(`${baseUrl}/ips`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ values: ['1.1.1.1'], mode: 'blacklist', padding: 'x'.repeat(200 * 1024) }),
  });
  const json = await res.json();

  assert.equal(res.status, 413);
  assert.equal(json.code, 'PAYLOAD_TOO_LARGE');
});

test('POST with an unsupported content-encoding returns 415 UNSUPPORTED_MEDIA_TYPE', async () => {
  const res = await fetch(`${baseUrl}/ips`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'content-encoding': 'compress' },
    body: JSON.stringify({ values: ['1.1.1.1'], mode: 'blacklist' }),
  });
  const json = await res.json();

  assert.equal(res.status, 415);
  assert.equal(json.code, 'UNSUPPORTED_MEDIA_TYPE');
});
