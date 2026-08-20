import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { eq } from 'drizzle-orm';
import { db } from '../../src/adapters/output/persistence/postgres/db';
import { ipRules, ruleIndex } from '../../src/adapters/output/persistence/postgres/schema';
import { DrizzleRuleRepository } from '../../src/adapters/output/persistence/postgres/DrizzleRuleRepository';
import { Rule } from '../../src/domain/rules';

beforeEach(async () => {
  await db.delete(ruleIndex); // cascades to ip_rules/domain_rules/port_rules
});

test('ids are unique across modes and rule types', async () => {
  const repo = new DrizzleRuleRepository();

  const ids = await Promise.all([
    repo.add(Rule.build('ip', '1.1.1.1'), 'blacklist'),
    repo.add(Rule.build('ip', '1.1.1.1'), 'whitelist'),
    repo.add(Rule.build('domain', 'example.com'), 'blacklist'),
    repo.add(Rule.build('port', '443'), 'whitelist'),
  ]);

  assert.equal(new Set(ids).size, 4);
  assert.equal((await repo.search(ids[0]))?.rule.type, 'ip');
  assert.equal((await repo.search(ids[2]))?.rule.value, 'example.com');
});

test('findAll(type) returns only rules of that type', async () => {
  const repo = new DrizzleRuleRepository();
  await repo.add(Rule.build('ip', '9.9.9.9'), 'blacklist');
  await repo.add(Rule.build('port', '8080'), 'whitelist');

  const ipOnly = await repo.findAll('ip');

  assert.equal(ipOnly.length, 1);
  assert.equal(ipOnly[0].rule.value, '9.9.9.9');
});

test('updateStatusMany flips active for the found rule', async () => {
  const repo = new DrizzleRuleRepository();
  const id = await repo.add(Rule.build('domain', 'example.com'), 'whitelist');

  const [updated] = await repo.updateStatusMany([id], false);

  assert.equal(updated.rule.active, false);
  assert.equal((await repo.search(id))?.rule.active, false);
});

test('deleteMany removes the rule_index row and cascades to the type table', async () => {
  const repo = new DrizzleRuleRepository();
  const id = await repo.add(Rule.build('ip', '8.8.8.8'), 'blacklist');

  const deleted = await repo.deleteMany([id]);

  assert.equal(deleted.length, 1);
  assert.equal(deleted[0].rule.value, '8.8.8.8');
  assert.equal(await repo.search(id), undefined);

  const [orphanedRow] = await db.select().from(ipRules).where(eq(ipRules.id, id));
  assert.equal(orphanedRow, undefined);
});
