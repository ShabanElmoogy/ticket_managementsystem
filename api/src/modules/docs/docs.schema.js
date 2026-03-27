import { pgTable, varchar, text, integer, timestamp, pgEnum, index, json, uuid } from 'drizzle-orm/pg-core';
import { tenants } from '../tenants/tenants.schema.js';
import { relations } from 'drizzle-orm';

export const docNodeTypeEnum = pgEnum('doc_node_type', ['FOLDER', 'DOC']);

export const docs = pgTable('docs', {
  id: varchar('id', { length: 191 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 191 }).notNull(),
  blocks: json('blocks').notNull().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const docNodes = pgTable('doc_nodes', {
  id: varchar('id', { length: 191 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  type: docNodeTypeEnum('type').notNull(),
  title: varchar('title', { length: 191 }).notNull(),
  position: integer('position').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  parentId: varchar('parent_id', { length: 191 }).references(() => docNodes.id, { onDelete: 'cascade' }),
  docId: varchar('doc_id', { length: 191 }).references(() => docs.id, { onDelete: 'cascade' }),
}, (table) => ({
  parentIdPositionIdx: index('doc_nodes_parent_id_position_idx').on(table.parentId, table.position),
  tenantIdParentIdPositionIdx: index('doc_nodes_tenant_id_parent_id_position_idx').on(table.tenantId, table.parentId, table.position),
}));

export const docsRelations = relations(docs, ({ many }) => ({
  nodes: many(docNodes),
}));

export const docNodesRelations = relations(docNodes, ({ one, many }) => ({
  parent: one(docNodes, {
    fields: [docNodes.parentId],
    references: [docNodes.id],
    relationName: 'parentChildren',
  }),
  children: many(docNodes, { relationName: 'parentChildren' }),
  doc: one(docs, {
    fields: [docNodes.docId],
    references: [docs.id],
  }),
}));