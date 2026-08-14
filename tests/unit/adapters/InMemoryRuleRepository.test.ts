import { test } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryRuleRepository } from '../../../src/adapters/output/persistence/inMemory/InMemoryRuleRepository';
import { Rule } from '../../../src/domain/rules';

test('ids are unique across modes and rule types', () => {
  const repo = new InMemoryRuleRepository();

  const ids = [
    repo.add(Rule.build('ip', '1.1.1.1'), 'blacklist'),
    repo.add(Rule.build('ip', '1.1.1.1'), 'whitelist'),
    repo.add(Rule.build('domain', 'example.com'), 'blacklist'),
    repo.add(Rule.build('port', '443'), 'whitelist'),
  ];

  assert.deepEqual(ids, [1, 2, 3, 4]);
  assert.equal(repo.search(2)?.rule.type, 'ip');
  assert.equal(repo.search(3)?.rule.value, 'example.com');
});
