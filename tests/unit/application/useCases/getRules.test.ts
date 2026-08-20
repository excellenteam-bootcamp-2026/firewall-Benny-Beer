import { addRules } from '../../../../src/application/useCases/addRules';
import { getRules } from '../../../../src/application/useCases/getRules';
import { InMemoryRuleRepository } from '../../../../src/adapters/output/persistence/inMemory/InMemoryRuleRepository';

describe('getRules', () => {
  test('with no filter, returns every type bucketed by mode', async () => {
    const repo = new InMemoryRuleRepository();
    await addRules(repo, 'ip', ['1.1.1.1'], 'blacklist');
    await addRules(repo, 'domain', ['example.com'], 'whitelist');

    const result = await getRules(repo);

    expect(result.ips.blacklist).toEqual([{ id: 1, value: '1.1.1.1', active: true }]);
    expect(result.domains.whitelist).toEqual([{ id: 2, value: 'example.com', active: true }]);
    expect(result.ports).toEqual({ blacklist: [], whitelist: [] });
  });

  test('with a type filter, returns only that type', async () => {
    const repo = new InMemoryRuleRepository();
    await addRules(repo, 'ip', ['1.1.1.1'], 'blacklist');
    await addRules(repo, 'port', ['8080'], 'whitelist');

    const result = await getRules(repo, 'ip');

    expect(Object.keys(result)).toEqual(['ips']);
    expect(result.ips.blacklist).toHaveLength(1);
  });
});
