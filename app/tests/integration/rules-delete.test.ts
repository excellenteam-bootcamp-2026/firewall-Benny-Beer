import request from 'supertest';
import app from '../../src/main/app';

async function createIpRule(value: string): Promise<number> {
  const res = await request(app)
    .post('/api/firewall/ips')
    .send({ values: [value], mode: 'blacklist' });
  return res.body.values[0].id;
}

describe('DELETE /api/firewall/rules', () => {
  test('removes an existing rule', async () => {
    const id = await createIpRule('198.51.100.20');

    const res = await request(app).delete('/api/firewall/rules').send({ ids: [id] });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.removed).toEqual([
      { id, type: 'ip', mode: 'blacklist', value: '198.51.100.20', active: true },
    ]);
  });

  test('removes multiple existing rules in one batch', async () => {
    const [id1, id2] = await Promise.all([createIpRule('198.51.100.21'), createIpRule('198.51.100.22')]);

    const res = await request(app)
      .delete('/api/firewall/rules')
      .send({ ids: [id1, id2] });

    expect(res.status).toBe(200);
    expect(res.body.removed).toHaveLength(2);
  });

  test('returns 404 RULE_NOT_FOUND for a non-existent id, without deleting anything else', async () => {
    const id = await createIpRule('198.51.100.23');

    const res = await request(app)
      .delete('/api/firewall/rules')
      .send({ ids: [id, 999999999] });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('RULE_NOT_FOUND');

    // The batch is all-or-nothing: the valid id must still exist.
    const getRes = await request(app).get('/api/firewall/rules?type=ip');
    expect(getRes.body.ips.blacklist.some((r: { id: number }) => r.id === id)).toBe(true);

    await request(app).delete('/api/firewall/rules').send({ ids: [id] });
  });

  test('rejects a non-integer id with 400 INVALID_REQUEST', async () => {
    const res = await request(app).delete('/api/firewall/rules').send({ ids: [1.5] });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_REQUEST');
  });

  test('rejects an empty ids array with 400 INVALID_REQUEST', async () => {
    const res = await request(app).delete('/api/firewall/rules').send({ ids: [] });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_REQUEST');
  });
});
