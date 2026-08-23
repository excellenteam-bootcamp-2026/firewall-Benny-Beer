import request from 'supertest';
import app from '../../src/main/app';

// Reserved high port range so these rows never clash with fixture/faker ports.
const createdIds: number[] = [];

afterAll(async () => {
  if (createdIds.length > 0) {
    await request(app).delete('/api/firewall/rules').send({ ids: createdIds });
  }
});

describe('POST /api/firewall/ports', () => {
  test('adds a single blacklist port rule and echoes a numeric value', async () => {
    const res = await request(app)
      .post('/api/firewall/ports')
      .send({ values: [60000], mode: 'blacklist' });

    expect(res.status).toBe(201);
    expect(res.body.values).toEqual([{ id: expect.any(Number), value: 60000, active: true }]);
    expect(typeof res.body.values[0].value).toBe('number');
    createdIds.push(res.body.values[0].id);
  });

  test('adds multiple blacklist port rules in one batch', async () => {
    const res = await request(app)
      .post('/api/firewall/ports')
      .send({ values: [60001, 60002], mode: 'blacklist' });

    expect(res.status).toBe(201);
    expect(res.body.values).toHaveLength(2);
    createdIds.push(...res.body.values.map((v: { id: number }) => v.id));
  });

  test('adds a single whitelist port rule given as a numeric string', async () => {
    const res = await request(app)
      .post('/api/firewall/ports')
      .send({ values: ['60003'], mode: 'whitelist' });

    expect(res.status).toBe(201);
    expect(res.body.values[0].value).toBe(60003);
    createdIds.push(res.body.values[0].id);
  });

  test('adds a larger whitelist batch', async () => {
    const res = await request(app)
      .post('/api/firewall/ports')
      .send({ values: [60004, 60005, 60006], mode: 'whitelist' });

    expect(res.status).toBe(201);
    expect(res.body.values).toHaveLength(3);
    createdIds.push(...res.body.values.map((v: { id: number }) => v.id));
  });

  test('rejects port 0, below the valid range', async () => {
    const res = await request(app)
      .post('/api/firewall/ports')
      .send({ values: [0], mode: 'blacklist' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_PORT');
  });

  test('rejects a negative port', async () => {
    const res = await request(app)
      .post('/api/firewall/ports')
      .send({ values: [-1], mode: 'blacklist' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_PORT');
  });

  test('rejects port 65536, above the valid range', async () => {
    const res = await request(app)
      .post('/api/firewall/ports')
      .send({ values: [65536], mode: 'blacklist' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_PORT');
  });

  test('rejects a value already stored, even across modes (fixture-seeded port)', async () => {
    const res = await request(app)
      .post('/api/firewall/ports')
      .send({ values: [443], mode: 'blacklist' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('DUPLICATE_RULE');
  });
});
