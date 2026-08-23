import request from 'supertest';
import app from '../../src/main/app';

describe('system: happy flow', () => {
  test('add a rule, find it, deactivate it, delete it, and confirm it is gone', async () => {
    const value = '198.51.100.99';

    const created = await request(app)
      .post('/api/firewall/ips')
      .send({ values: [value], mode: 'blacklist' });
    expect(created.status).toBe(201);
    const id = created.body.values[0].id;
    expect(created.body.values[0].active).toBe(true);

    const afterAdd = await request(app).get('/api/firewall/rules?type=ip');
    expect(afterAdd.status).toBe(200);
    expect(afterAdd.body.ips.blacklist.find((r: { id: number }) => r.id === id)).toEqual({
      id,
      value,
      active: true,
    });

    const patched = await request(app)
      .patch('/api/firewall/rules/status')
      .send({ ids: [id], active: false });
    expect(patched.status).toBe(200);
    expect(patched.body.updated[0].active).toBe(false);

    const afterPatch = await request(app).get('/api/firewall/rules?type=ip');
    expect(afterPatch.body.ips.blacklist.find((r: { id: number }) => r.id === id)?.active).toBe(false);

    const deleted = await request(app).delete('/api/firewall/rules').send({ ids: [id] });
    expect(deleted.status).toBe(200);
    expect(deleted.body.removed[0].id).toBe(id);

    const afterDelete = await request(app).get('/api/firewall/rules?type=ip');
    expect(afterDelete.body.ips.blacklist.some((r: { id: number }) => r.id === id)).toBe(false);
  });
});
