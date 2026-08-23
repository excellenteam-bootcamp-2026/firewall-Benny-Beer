import request from 'supertest';
import app from '../../src/main/app';

// Reserved, collision-free namespace (RFC 5737 TEST-NET-2) so these rows never
// clash with the mock-data fixtures seeded once in globalSetup.
const createdIds: number[] = [];

afterAll(async () => {
  if (createdIds.length > 0) {
    await request(app).delete('/api/firewall/rules').send({ ids: createdIds });
  }
});

describe('POST /api/firewall/ips', () => {
  test('adds a single blacklist IP rule', async () => {
    const res = await request(app)
      .post('/api/firewall/ips')
      .send({ values: ['198.51.100.10'], mode: 'blacklist' });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.type).toBe('ip');
    expect(res.body.mode).toBe('blacklist');
    expect(res.body.values).toEqual([{ id: expect.any(Number), value: '198.51.100.10', active: true }]);
    createdIds.push(res.body.values[0].id);
  });

  test('adds multiple blacklist IP rules in one batch', async () => {
    const res = await request(app)
      .post('/api/firewall/ips')
      .send({ values: ['198.51.100.11', '198.51.100.12'], mode: 'blacklist' });

    expect(res.status).toBe(201);
    expect(res.body.values.map((v: { value: string }) => v.value)).toEqual([
      '198.51.100.11',
      '198.51.100.12',
    ]);
    createdIds.push(...res.body.values.map((v: { id: number }) => v.id));
  });

  test('adds a single whitelist IP rule', async () => {
    const res = await request(app)
      .post('/api/firewall/ips')
      .send({ values: ['198.51.100.13'], mode: 'whitelist' });

    expect(res.status).toBe(201);
    expect(res.body.mode).toBe('whitelist');
    createdIds.push(res.body.values[0].id);
  });

  test('adds a larger whitelist batch', async () => {
    const res = await request(app)
      .post('/api/firewall/ips')
      .send({ values: ['198.51.100.14', '198.51.100.15', '198.51.100.16'], mode: 'whitelist' });

    expect(res.status).toBe(201);
    expect(res.body.values).toHaveLength(3);
    createdIds.push(...res.body.values.map((v: { id: number }) => v.id));
  });

  test('rejects a malformed IPv4 address with 400 INVALID_IP', async () => {
    const res = await request(app)
      .post('/api/firewall/ips')
      .send({ values: ['999.999.999.999'], mode: 'blacklist' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      status: 'error',
      code: 'INVALID_IP',
      message: expect.any(String),
    });
  });

  test('rejects an address with a leading zero in an octet', async () => {
    const res = await request(app)
      .post('/api/firewall/ips')
      .send({ values: ['01.1.1.1'], mode: 'blacklist' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_IP');
  });

  test('rejects a value already stored, even across modes (fixture-seeded IP)', async () => {
    const res = await request(app)
      .post('/api/firewall/ips')
      .send({ values: ['1.1.1.1'], mode: 'blacklist' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('DUPLICATE_RULE');
  });
});
