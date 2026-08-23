import { and, eq, inArray } from 'drizzle-orm';
import { db } from './db';
import { domainRules, ipRules, portRules, ruleIndex } from './schema';
import { Rule, RULE_TYPES, RuleType } from '../../../../domain/rules';
import { RuleMode } from '../../../../domain/rules/RuleTypes';
import { RuleRepository, StoredRule } from '../../../../application/ports/RuleRepository';

const TYPE_TABLE = {
  ip: ipRules,
  domain: domainRules,
  port: portRules,
} as const;

interface IndexRow {
  id: number;
  type: RuleType;
  mode: RuleMode;
  active: boolean;
}

function groupIdsByType(rows: IndexRow[]): Partial<Record<RuleType, number[]>> {
  const byType: Partial<Record<RuleType, number[]>> = {};
  for (const row of rows) {
    (byType[row.type] ??= []).push(row.id);
  }
  return byType;
}

async function fetchValues(byType: Partial<Record<RuleType, number[]>>): Promise<Map<number, string>> {
  const values = new Map<number, string>();

  for (const type of Object.keys(byType) as RuleType[]) {
    const ids = byType[type]!;
    const table = TYPE_TABLE[type];
    const rows = await db.select({ id: table.id, value: table.value }).from(table).where(inArray(table.id, ids));
    for (const row of rows) values.set(row.id, row.value);
  }

  return values;
}

function toStoredRule(row: IndexRow, value: string): StoredRule {
  return { id: row.id, mode: row.mode, rule: Rule.build(row.type, value, row.active) };
}

export class DrizzleRuleRepository implements RuleRepository {
  async add(rule: Rule, mode: RuleMode): Promise<number> {
    return db.transaction(async (tx) => {
      const [{ id }] = await tx
        .insert(ruleIndex)
        .values({ type: rule.type, mode, active: rule.active })
        .returning({ id: ruleIndex.id });

      switch (rule.type) {
        case 'ip':
          await tx.insert(ipRules).values({ id, value: String(rule.value) });
          break;
        case 'domain':
          await tx.insert(domainRules).values({ id, value: String(rule.value) });
          break;
        case 'port':
          await tx.insert(portRules).values({ id, value: String(rule.value) });
          break;
      }

      return id;
    });
  }

  async search(id: number): Promise<StoredRule | undefined> {
    const [found] = await this.searchMany([id]);
    return found;
  }

  async searchMany(ids: number[]): Promise<StoredRule[]> {
    if (ids.length === 0) return [];

    const rows = await db.select().from(ruleIndex).where(inArray(ruleIndex.id, ids));
    const values = await fetchValues(groupIdsByType(rows));

    return rows.map((row) => toStoredRule(row, values.get(row.id)!));
  }

  async delete(id: number): Promise<StoredRule | undefined> {
    const [found] = await this.deleteMany([id]);
    return found;
  }

  async deleteMany(ids: number[]): Promise<StoredRule[]> {
    if (ids.length === 0) return [];

    const found = await this.searchMany(ids);
    if (found.length > 0) {
      await db.delete(ruleIndex).where(
        inArray(
          ruleIndex.id,
          found.map((s) => s.id),
        ),
      );
    }
    return found;
  }

  async updateStatusMany(ids: number[], active: boolean): Promise<StoredRule[]> {
    if (ids.length === 0) return [];

    const rows = await db.update(ruleIndex).set({ active }).where(inArray(ruleIndex.id, ids)).returning();
    const values = await fetchValues(groupIdsByType(rows));

    return rows.map((row) => toStoredRule(row, values.get(row.id)!));
  }

  async findByValue(type: RuleType, values: (string | number)[]): Promise<StoredRule[]> {
    if (values.length === 0) return [];

    const table = TYPE_TABLE[type];
    const stringValues = values.map(String);

    const rows = await db
      .select({
        id: ruleIndex.id,
        type: ruleIndex.type,
        mode: ruleIndex.mode,
        active: ruleIndex.active,
        value: table.value,
      })
      .from(ruleIndex)
      .innerJoin(table, eq(table.id, ruleIndex.id))
      .where(and(eq(ruleIndex.type, type), inArray(table.value, stringValues)));

    return rows.map((row) => toStoredRule(row, row.value));
  }

  async findAll(type?: RuleType): Promise<StoredRule[]> {
    const types = type ? [type] : [...RULE_TYPES];
    const results: StoredRule[] = [];

    for (const t of types) {
      const table = TYPE_TABLE[t];
      const rows = await db
        .select({
          id: ruleIndex.id,
          type: ruleIndex.type,
          mode: ruleIndex.mode,
          active: ruleIndex.active,
          value: table.value,
        })
        .from(ruleIndex)
        .innerJoin(table, eq(table.id, ruleIndex.id))
        .where(eq(ruleIndex.type, t));

      results.push(...rows.map((row) => toStoredRule(row, row.value)));
    }

    return results;
  }
}
