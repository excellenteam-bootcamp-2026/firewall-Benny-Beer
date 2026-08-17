import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addRules } from '../../../../src/application/useCases/addRules';
import { InMemoryRuleRepository } from '../../../../src/adapters/output/persistence/inMemory/InMemoryRuleRepository';

test('addRules persists every value and assigns increasing ids', async () => {
  const repo = new InMemoryRuleRepository();

  const added = await addRules(repo, 'ip', ['1.1.1.1', '2.2.2.2'], 'blacklist');

  assert.deepEqual(
    added.map(({ id, rule }) => ({ id, value: rule.value, active: rule.active })),
    [
      { id: 1, value: '1.1.1.1', active: true },
      { id: 2, value: '2.2.2.2', active: true },
    ],
  );
});

test('addRules rejects the whole batch without persisting when one value is invalid', async () => {
  const repo = new InMemoryRuleRepository();

  await assert.rejects(() => addRules(repo, 'ip', ['1.1.1.1', 'not-an-ip'], 'blacklist'));
  assert.equal(await repo.search(1), undefined);
});
