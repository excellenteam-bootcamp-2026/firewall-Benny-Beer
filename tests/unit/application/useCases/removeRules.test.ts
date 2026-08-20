import { addRules } from '../../../../src/application/useCases/addRules';
import { removeRules } from '../../../../src/application/useCases/removeRules';
import { InMemoryRuleRepository } from '../../../../src/adapters/output/persistence/inMemory/InMemoryRuleRepository';
import { RuleNotFoundError } from '../../../../src/application/errors';

describe('removeRules', () => {
  test('deletes every id in the batch', async () => {
    const repo = new InMemoryRuleRepository();
    const [{ id: id1 }, { id: id2 }] = await addRules(repo, 'ip', ['1.1.1.1', '2.2.2.2'], 'blacklist');

    const removed = await removeRules(repo, [id1, id2]);

    expect(removed).toHaveLength(2);
    expect(await repo.findAll('ip')).toHaveLength(0);
  });

  test('rejects the whole batch without deleting anything when one id is missing', async () => {
    const repo = new InMemoryRuleRepository();
    const [{ id }] = await addRules(repo, 'ip', ['1.1.1.1'], 'blacklist');

    await expect(removeRules(repo, [id, 999])).rejects.toThrow(RuleNotFoundError);

    expect(await repo.findAll('ip')).toHaveLength(1);
  });
});
