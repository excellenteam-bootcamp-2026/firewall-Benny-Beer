import request from 'supertest';
import app from '../../src/main/app';

describe('GET /api/firewall/rules', () => {
  test('with no filter, returns every type with at least the seeded fixture rows', async () => {
    const res = await request(app).get('/api/firewall/rules');

    expect(res.status).toBe(200);
    expect(res.body.ips.blacklist.length).toBeGreaterThanOrEqual(10);
    expect(res.body.ips.whitelist.length).toBeGreaterThanOrEqual(10);
    expect(res.body.domains.blacklist.length).toBeGreaterThanOrEqual(10);
    expect(res.body.ports.whitelist.length).toBeGreaterThanOrEqual(10);
  });

  test('?type=ip returns only the ips key', async () => {
    const res = await request(app).get('/api/firewall/rules?type=ip');

    expect(res.status).toBe(200);
    expect(Object.keys(res.body)).toEqual(['ips']);
    expect(res.body.ips.blacklist.length).toBeGreaterThanOrEqual(10);
  });

  test('?type=domain returns only the domains key', async () => {
    const res = await request(app).get('/api/firewall/rules?type=domain');

    expect(res.status).toBe(200);
    expect(Object.keys(res.body)).toEqual(['domains']);
  });

  test('?type=port returns only the ports key', async () => {
    const res = await request(app).get('/api/firewall/rules?type=port');

    expect(res.status).toBe(200);
    expect(Object.keys(res.body)).toEqual(['ports']);
  });

  test('an unsupported ?type value returns 400 INVALID_REQUEST', async () => {
    const res = await request(app).get('/api/firewall/rules?type=mac');

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_REQUEST');
  });
});
