import { addRules } from '../../../../src/application/useCases/addRules';
import { InMemoryRuleRepository } from '../../../../src/adapters/output/persistence/inMemory/InMemoryRuleRepository';
import { DuplicateRuleError } from '../../../../src/application/errors';
import { InvalidRuleValueError } from '../../../../src/domain/rules';

describe('addRules', () => {
  test('persists every value and assigns increasing ids', async () => {
    const repo = new InMemoryRuleRepository();

    const added = await addRules(repo, 'ip', ['1.1.1.1', '2.2.2.2'], 'blacklist');

    expect(added.map(({ id, rule }) => ({ id, value: rule.value, active: rule.active }))).toEqual([
      { id: 1, value: '1.1.1.1', active: true },
      { id: 2, value: '2.2.2.2', active: true },
    ]);
  });

  test('rejects the whole batch without persisting anything when one value is invalid', async () => {
    const repo = new InMemoryRuleRepository();

    await expect(addRules(repo, 'ip', ['1.1.1.1', 'not-an-ip'], 'blacklist')).rejects.toThrow(
      InvalidRuleValueError,
    );

    expect(await repo.findAll('ip')).toHaveLength(0);
  });

  test('rejects a value that already exists in the same mode, and does not create a second row', async () => {
    const repo = new InMemoryRuleRepository();
    await addRules(repo, 'ip', ['1.1.1.1'], 'blacklist');

    await expect(addRules(repo, 'ip', ['1.1.1.1'], 'blacklist')).rejects.toThrow(DuplicateRuleError);

    expect(await repo.findAll('ip')).toHaveLength(1);
  });

  test('rejects a value that already exists in the other mode (global uniqueness), and does not create a second row', async () => {
    const repo = new InMemoryRuleRepository();
    await addRules(repo, 'ip', ['1.1.1.1'], 'blacklist');

    await expect(addRules(repo, 'ip', ['1.1.1.1'], 'whitelist')).rejects.toThrow(DuplicateRuleError);

    expect(await repo.findAll('ip')).toHaveLength(1);
  });
});
