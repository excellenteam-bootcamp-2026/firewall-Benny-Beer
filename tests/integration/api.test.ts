import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import app from '../../src/main/app';
import { db } from '../../src/adapters/output/persistence/postgres/db';
import { ruleIndex } from '../../src/adapters/output/persistence/postgres/schema';

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

beforeEach(async () => {
  await db.delete(ruleIndex); // cascades to ip_rules/domain_rules/port_rules
});

async function request(method: string, path: string, body?: unknown) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await res.json();
  console.log(`${method} ${path}`, body ?? '', '->', res.status, json);
  return { status: res.status, body: json };
}

test('POST /api/firewall/ips adds IP rules', async () => {
  const { status, body } = await request('POST', '/ips', { values: ['1.1.1.1', '2.2.2.2'], mode: 'blacklist' });

  assert.equal(status, 201);
  assert.equal(body.status, 'success');
  assert.deepEqual(
    body.values.map((v: { value: string; active: boolean }) => ({ value: v.value, active: v.active })),
    [
      { value: '1.1.1.1', active: true },
      { value: '2.2.2.2', active: true },
    ],
  );
});

test('POST /api/firewall/domains adds domain rules', async () => {
  const { status, body } = await request('POST', '/domains', { values: ['example.com'], mode: 'whitelist' });

  assert.equal(status, 201);
  assert.equal(body.values[0].value, 'example.com');
});

test('POST /api/firewall/ports adds port rules and echoes numeric values', async () => {
  const { status, body } = await request('POST', '/ports', { values: [8080], mode: 'blacklist' });

  assert.equal(status, 201);
  assert.equal(body.values[0].value, 8080);
  assert.equal(typeof body.values[0].value, 'number');
});

test('POST /api/firewall/ips rejects a duplicate value with 409, even across modes', async () => {
  const first = await request('POST', '/ips', { values: ['7.7.7.7'], mode: 'blacklist' });
  assert.equal(first.status, 201);

  const sameMode = await request('POST', '/ips', { values: ['7.7.7.7'], mode: 'blacklist' });
  assert.equal(sameMode.status, 409);
  assert.equal(sameMode.body.code, 'DUPLICATE_RULE');

  const otherMode = await request('POST', '/ips', { values: ['7.7.7.7'], mode: 'whitelist' });
  assert.equal(otherMode.status, 409);
  assert.equal(otherMode.body.code, 'DUPLICATE_RULE');
});

test('GET /api/firewall/rules?type=ip returns only ip rules', async () => {
  await request('POST', '/ips', { values: ['3.3.3.3'], mode: 'blacklist' });
  await request('POST', '/ports', { values: ['443'], mode: 'whitelist' });

  const { status, body } = await request('GET', '/rules?type=ip');

  assert.equal(status, 200);
  assert.equal(body.ips.blacklist.length, 1);
  assert.equal(body.ips.blacklist[0].value, '3.3.3.3');
  assert.equal(body.ports, undefined);
});

test('GET /api/firewall/rules with no filter returns every type', async () => {
  await request('POST', '/ips', { values: ['4.4.4.4'], mode: 'blacklist' });
  await request('POST', '/domains', { values: ['test.com'], mode: 'whitelist' });

  const { status, body } = await request('GET', '/rules');

  assert.equal(status, 200);
  assert.equal(body.ips.blacklist.length, 1);
  assert.equal(body.domains.whitelist.length, 1);
  assert.equal(body.ports.blacklist.length, 0);
});

test('PATCH /api/firewall/rules/status deactivates a rule', async () => {
  const added = await request('POST', '/ips', { values: ['5.5.5.5'], mode: 'blacklist' });
  const id = added.body.values[0].id;

  const { status, body } = await request('PATCH', '/rules/status', { ids: [id], active: false });

  assert.equal(status, 200);
  assert.equal(body.updated[0].id, id);
  assert.equal(body.updated[0].active, false);
});

test('PATCH /api/firewall/rules/status 404s when an id does not exist', async () => {
  const { status } = await request('PATCH', '/rules/status', { ids: [999999], active: false });

  assert.equal(status, 404);
});

test('DELETE /api/firewall/rules removes rules', async () => {
  const added = await request('POST', '/ips', { values: ['6.6.6.6'], mode: 'blacklist' });
  const id = added.body.values[0].id;

  const { status, body } = await request('DELETE', '/rules', { ids: [id] });

  assert.equal(status, 200);
  assert.equal(body.removed[0].id, id);

  const after = await request('GET', '/rules?type=ip');
  assert.equal(
    after.body.ips.blacklist.find((r: { id: number }) => r.id === id),
    undefined,
  );
});
