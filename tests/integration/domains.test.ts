import request from 'supertest';
import app from '../../src/main/app';

// Reserved TLD (RFC 2606) so these rows never clash with fixture/faker domains.
const createdIds: number[] = [];

afterAll(async () => {
  if (createdIds.length > 0) {
    await request(app).delete('/api/firewall/rules').send({ ids: createdIds });
  }
});

describe('POST /api/firewall/domains', () => {
  test('adds a single blacklist domain rule, lower-casing the value', async () => {
    const res = await request(app)
      .post('/api/firewall/domains')
      .send({ values: ['Case-1.test'], mode: 'blacklist' });

    expect(res.status).toBe(201);
    expect(res.body.values).toEqual([{ id: expect.any(Number), value: 'case-1.test', active: true }]);
    createdIds.push(res.body.values[0].id);
  });

  test('adds multiple blacklist domain rules in one batch', async () => {
    const res = await request(app)
      .post('/api/firewall/domains')
      .send({ values: ['case-2.test', 'case-3.test'], mode: 'blacklist' });

    expect(res.status).toBe(201);
    expect(res.body.values).toHaveLength(2);
    createdIds.push(...res.body.values.map((v: { id: number }) => v.id));
  });

  test('adds a single whitelist domain rule', async () => {
    const res = await request(app)
      .post('/api/firewall/domains')
      .send({ values: ['case-4.test'], mode: 'whitelist' });

    expect(res.status).toBe(201);
    expect(res.body.mode).toBe('whitelist');
    createdIds.push(res.body.values[0].id);
  });

  test('adds a deeply nested subdomain', async () => {
    const res = await request(app)
      .post('/api/firewall/domains')
      .send({ values: ['a.b.case-5.test'], mode: 'whitelist' });

    expect(res.status).toBe(201);
    expect(res.body.values[0].value).toBe('a.b.case-5.test');
    createdIds.push(res.body.values[0].id);
  });

  test('rejects a full URL instead of a bare domain with 400 INVALID_DOMAIN', async () => {
    const res = await request(app)
      .post('/api/firewall/domains')
      .send({ values: ['https://example.com/path'], mode: 'blacklist' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_DOMAIN');
  });

  test('rejects a single label with no TLD', async () => {
    const res = await request(app)
      .post('/api/firewall/domains')
      .send({ values: ['localhost'], mode: 'blacklist' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_DOMAIN');
  });

  test('rejects a value already stored, even across modes (fixture-seeded domain)', async () => {
    const res = await request(app)
      .post('/api/firewall/domains')
      .send({ values: ['my-site.com'], mode: 'whitelist' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('DUPLICATE_RULE');
  });
});
