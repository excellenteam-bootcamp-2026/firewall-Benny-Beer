import request from 'supertest';
import app from '../../src/main/app';

const createdIds: number[] = [];

afterAll(async () => {
  if (createdIds.length > 0) {
    await request(app).delete('/api/firewall/rules').send({ ids: createdIds });
  }
});

async function createIpRule(value: string): Promise<number> {
  const res = await request(app)
    .post('/api/firewall/ips')
    .send({ values: [value], mode: 'whitelist' });
  const id = res.body.values[0].id;
  createdIds.push(id);
  return id;
}

describe('PATCH /api/firewall/rules/status', () => {
  test('deactivates an active rule', async () => {
    const id = await createIpRule('198.51.100.30');

    const res = await request(app)
      .patch('/api/firewall/rules/status')
      .send({ ids: [id], active: false });

    expect(res.status).toBe(200);
    expect(res.body.updated).toEqual([
      { id, type: 'ip', mode: 'whitelist', value: '198.51.100.30', active: false },
    ]);
  });

  test('reactivates a previously deactivated rule', async () => {
    const id = await createIpRule('198.51.100.31');
    await request(app).patch('/api/firewall/rules/status').send({ ids: [id], active: false });

    const res = await request(app).patch('/api/firewall/rules/status').send({ ids: [id], active: true });

    expect(res.status).toBe(200);
    expect(res.body.updated[0].active).toBe(true);
  });

  test('updates multiple ids in one batch', async () => {
    const [id1, id2] = await Promise.all([createIpRule('198.51.100.32'), createIpRule('198.51.100.33')]);

    const res = await request(app)
      .patch('/api/firewall/rules/status')
      .send({ ids: [id1, id2], active: false });

    expect(res.status).toBe(200);
    expect(res.body.updated).toHaveLength(2);
  });

  test('returns 404 RULE_NOT_FOUND for a non-existent id, without mutating anything else', async () => {
    const id = await createIpRule('198.51.100.34');

    const res = await request(app)
      .patch('/api/firewall/rules/status')
      .send({ ids: [id, 999999999], active: false });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('RULE_NOT_FOUND');

    const getRes = await request(app).get('/api/firewall/rules?type=ip');
    const rule = getRes.body.ips.whitelist.find((r: { id: number }) => r.id === id);
    expect(rule.active).toBe(true);
  });

  test('rejects a non-boolean active flag with 400 INVALID_REQUEST', async () => {
    const id = await createIpRule('198.51.100.35');

    const res = await request(app)
      .patch('/api/firewall/rules/status')
      .send({ ids: [id], active: 'false' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_REQUEST');
  });
});
