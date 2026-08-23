import { boolean, index, integer, pgEnum, pgTable, serial, text } from 'drizzle-orm/pg-core';

export const ruleTypeEnum = pgEnum('rule_type', ['ip', 'domain', 'port']);
export const ruleModeEnum = pgEnum('rule_mode', ['blacklist', 'whitelist']);

export const ruleIndex = pgTable(
  'rule_index',
  {
    id: serial('id').primaryKey(),
    type: ruleTypeEnum('type').notNull(),
    mode: ruleModeEnum('mode').notNull(),
    active: boolean('active').notNull().default(true),
  },
  (t) => [index('rule_index_type_mode_active_idx').on(t.type, t.mode, t.active)],
);

export const ipRules = pgTable('ip_rules', {
  id: integer('id')
    .primaryKey()
    .references(() => ruleIndex.id, { onDelete: 'cascade' }),
  value: text('value').notNull(),
});

export const domainRules = pgTable('domain_rules', {
  id: integer('id')
    .primaryKey()
    .references(() => ruleIndex.id, { onDelete: 'cascade' }),
  value: text('value').notNull(),
});

export const portRules = pgTable('port_rules', {
  id: integer('id')
    .primaryKey()
    .references(() => ruleIndex.id, { onDelete: 'cascade' }),
  value: text('value').notNull(),
});
