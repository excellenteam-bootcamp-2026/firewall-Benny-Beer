import { eq } from 'drizzle-orm';
import { db } from '../../src/adapters/output/persistence/postgres/db';
import { ipRules } from '../../src/adapters/output/persistence/postgres/schema';
import { DrizzleRuleRepository } from '../../src/adapters/output/persistence/postgres/DrizzleRuleRepository';
import { Rule } from '../../src/domain/rules';

const repo = new DrizzleRuleRepository();
const createdIds: number[] = [];

afterAll(async () => {
  await repo.deleteMany(createdIds.filter((id) => id != null));
});

describe('DrizzleRuleRepository', () => {
  // No use case calls the singular search()/delete() — only searchMany/deleteMany
  // — so these are exercised directly here.
  test('search() finds a single stored rule by id', async () => {
    const id = await repo.add(Rule.build('ip', '198.51.100.40'), 'blacklist');
    createdIds.push(id);

    const found = await repo.search(id);

    expect(found?.rule.value).toBe('198.51.100.40');
    expect(found?.rule.type).toBe('ip');
    expect(found?.mode).toBe('blacklist');
  });

  test('search() returns undefined for an id that does not exist', async () => {
    expect(await repo.search(999999999)).toBeUndefined();
  });

  test('delete() removes a single stored rule and returns it', async () => {
    const id = await repo.add(Rule.build('ip', '198.51.100.41'), 'blacklist');

    const deleted = await repo.delete(id);

    expect(deleted?.rule.value).toBe('198.51.100.41');
    expect(await repo.search(id)).toBeUndefined();
  });

  test('findAll(type) returns only rules of that type', async () => {
    const ipId = await repo.add(Rule.build('ip', '198.51.100.42'), 'blacklist');
    const portId = await repo.add(Rule.build('port', 60010), 'whitelist');
    createdIds.push(ipId, portId);

    const ipOnly = await repo.findAll('ip');

    expect(ipOnly.some((stored) => stored.rule.value === '198.51.100.42')).toBe(true);
    expect(ipOnly.every((stored) => stored.rule.type === 'ip')).toBe(true);
  });

  test('findByValue finds an existing value across both modes', async () => {
    const id = await repo.add(Rule.build('ip', '198.51.100.43'), 'whitelist');
    createdIds.push(id);

    const found = await repo.findByValue('ip', ['198.51.100.43']);

    expect(found).toHaveLength(1);
    expect(found[0].mode).toBe('whitelist');
  });

  test('deleteMany cascades to the type-specific table', async () => {
    const id = await repo.add(Rule.build('ip', '198.51.100.44'), 'blacklist');

    await repo.deleteMany([id]);

    const [orphanedRow] = await db.select().from(ipRules).where(eq(ipRules.id, id));
    expect(orphanedRow).toBeUndefined();
  });

  // Reached in practice only via a validated non-empty body (Validation.ts
  // rejects empty arrays before the repository is called), so these short-
  // circuit branches are exercised directly.
  test('the batch methods short-circuit to an empty result for an empty id/value list', async () => {
    expect(await repo.searchMany([])).toEqual([]);
    expect(await repo.deleteMany([])).toEqual([]);
    expect(await repo.updateStatusMany([], true)).toEqual([]);
    expect(await repo.findByValue('ip', [])).toEqual([]);
  });

  test('deleteMany is a no-op when none of the given ids exist', async () => {
    expect(await repo.deleteMany([999999999])).toEqual([]);
  });

  test('findAll() with no type returns rules of every type', async () => {
    const ipId = await repo.add(Rule.build('ip', '198.51.100.45'), 'blacklist');
    const portId = await repo.add(Rule.build('port', 60011), 'whitelist');
    createdIds.push(ipId, portId);

    const all = await repo.findAll();

    expect(all.some((stored) => stored.rule.value === '198.51.100.45')).toBe(true);
    expect(all.some((stored) => stored.rule.value === 60011)).toBe(true);
  });
});
