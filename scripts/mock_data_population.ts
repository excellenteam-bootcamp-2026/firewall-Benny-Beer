import { faker } from '@faker-js/faker';
import { db } from '../src/adapters/output/persistence/postgres/db';
import { ruleIndex } from '../src/adapters/output/persistence/postgres/schema';
import { connectWithRetry } from '../src/adapters/output/persistence/postgres/connect';
import { DrizzleRuleRepository } from '../src/adapters/output/persistence/postgres/DrizzleRuleRepository';
import { Rule, RULE_TYPES } from '../src/domain/rules';
import type { RuleMode, RuleType } from '../src/domain/rules';

const MODES: RuleMode[] = ['blacklist', 'whitelist'];
const ROWS_PER_COMBINATION = 10;
const MAX_GENERATION_ATTEMPTS = 20;

const EDGE_CASES: Record<RuleType, (string | number)[]> = {
  ip: ['0.0.0.0', '255.255.255.255', '127.0.0.1', '1.1.1.1'],
  domain: ['a.co', `${'a'.repeat(63)}.com`, 'my-site.com', 'a.b.c.example.com'],
  port: [1, 65535, 443, 8080],
};

function randomCandidate(type: RuleType): string | number {
  switch (type) {
    case 'ip':
      return faker.internet.ipv4();
    case 'domain':
      return faker.internet.domainName();
    case 'port':
      return faker.number.int({ min: 1, max: 65535 });
  }
}

// faker's generators aren't guaranteed to satisfy this app's stricter validators
// (e.g. domain label/length rules), so retry until a candidate actually validates.
function generateRandomValue(type: RuleType): string | number {
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const candidate = randomCandidate(type);
    try {
      Rule.build(type, candidate);
      return candidate;
    } catch {
      continue;
    }
  }
  throw new Error(`Could not generate a valid random ${type} value after ${MAX_GENERATION_ATTEMPTS} attempts`);
}

function buildValues(type: RuleType): (string | number)[] {
  const values = [...EDGE_CASES[type]];
  while (values.length < ROWS_PER_COMBINATION) {
    values.push(generateRandomValue(type));
  }
  return values.slice(0, ROWS_PER_COMBINATION);
}

export async function populateMockData(): Promise<Record<RuleType, number>> {
  await connectWithRetry();

  console.log('Clearing existing rule data...');
  await db.delete(ruleIndex);

  const repository = new DrizzleRuleRepository();
  const counts: Record<RuleType, number> = { ip: 0, domain: 0, port: 0 };

  for (const type of RULE_TYPES) {
    for (const mode of MODES) {
      const values = buildValues(type);
      for (const [index, value] of values.entries()) {
        const active = index % 2 === 0;
        const rule = Rule.build(type, value, active);
        await repository.add(rule, mode);
        counts[type] += 1;
      }
    }
  }

  return counts;
}

if (require.main === module) {
  populateMockData()
    .then((counts) => {
      const total = counts.ip + counts.domain + counts.port;
      console.log(`Inserted ${total} rules: ${counts.ip} ip, ${counts.domain} domain, ${counts.port} port.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Failed to populate mock data:', err);
      process.exit(1);
    });
}
