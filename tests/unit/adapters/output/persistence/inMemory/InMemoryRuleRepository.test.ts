import { InMemoryRuleRepository } from '../../../../../../src/adapters/output/persistence/inMemory/InMemoryRuleRepository';
import { Rule } from '../../../../../../src/domain/rules';

describe('InMemoryRuleRepository', () => {
  // No use case calls the singular delete() — only deleteMany — so it's
  // exercised directly here, mirroring DrizzleRuleRepository's coverage.
  test('delete() removes and returns a stored rule by id', async () => {
    const repo = new InMemoryRuleRepository();
    const id = await repo.add(Rule.build('ip', '1.1.1.1'), 'blacklist');

    const deleted = await repo.delete(id);

    expect(deleted?.rule.value).toBe('1.1.1.1');
    expect(await repo.search(id)).toBeUndefined();
  });

  test('delete() returns undefined for an id that does not exist', async () => {
    const repo = new InMemoryRuleRepository();

    expect(await repo.delete(999)).toBeUndefined();
  });

  test('findAll() with no type returns rules of every type', async () => {
    const repo = new InMemoryRuleRepository();
    await repo.add(Rule.build('ip', '1.1.1.1'), 'blacklist');
    await repo.add(Rule.build('port', 443), 'whitelist');

    const all = await repo.findAll();

    expect(all).toHaveLength(2);
  });
});
