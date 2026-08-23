import { addRules } from '../../../../src/application/useCases/addRules';
import { updateRuleStatus } from '../../../../src/application/useCases/updateRuleStatus';
import { InMemoryRuleRepository } from '../../../../src/adapters/output/persistence/inMemory/InMemoryRuleRepository';
import { RuleNotFoundError } from '../../../../src/application/errors';

describe('updateRuleStatus', () => {
  test('deactivates every id in the batch', async () => {
    const repo = new InMemoryRuleRepository();
    const [{ id }] = await addRules(repo, 'domain', ['example.com'], 'whitelist');

    const [updated] = await updateRuleStatus(repo, [id], false);

    expect(updated.rule.active).toBe(false);
    expect((await repo.search(id))?.rule.active).toBe(false);
  });

  test('reactivates every id in the batch', async () => {
    const repo = new InMemoryRuleRepository();
    const [{ id }] = await addRules(repo, 'domain', ['example.com'], 'whitelist');
    await updateRuleStatus(repo, [id], false);

    const [updated] = await updateRuleStatus(repo, [id], true);

    expect(updated.rule.active).toBe(true);
    expect((await repo.search(id))?.rule.active).toBe(true);
  });

  test('rejects the whole batch without mutating anything when one id is missing', async () => {
    const repo = new InMemoryRuleRepository();
    const [{ id }] = await addRules(repo, 'domain', ['example.com'], 'whitelist');

    await expect(updateRuleStatus(repo, [id, 999], false)).rejects.toThrow(RuleNotFoundError);

    expect((await repo.search(id))?.rule.active).toBe(true);
  });
});
