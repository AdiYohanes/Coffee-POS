import { pgTable, varchar, decimal, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const roleEnum = pgEnum('role', ['CASHIER', 'BARISTA', 'ADMIN']);
export const orderStatusEnum = pgEnum('order_status', ['PENDING', 'DONE', 'VOID']);

export const users = pgTable('users', {
  id: varchar('id', { length: 12 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  role: roleEnum('role').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const categories = pgTable('categories', {
  id: varchar('id', { length: 12 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const items = pgTable('items', {
  id: varchar('id', { length: 12 }).primaryKey(),
  categoryId: varchar('category_id', { length: 12 })
    .references(() => categories.id)
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  basePrice: decimal('base_price', { precision: 10, scale: 2 }).notNull(),
  imageUrl: varchar('image_url', { length: 1024 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const modifiers = pgTable('modifiers', {
  id: varchar('id', { length: 12 }).primaryKey(),
  itemId: varchar('item_id', { length: 12 })
    .references(() => items.id)
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  additionalPrice: decimal('additional_price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const orders = pgTable('orders', {
  id: varchar('id', { length: 12 }).primaryKey(),
  userId: varchar('user_id', { length: 12 })
    .references(() => users.id)
    .notNull(),
  status: orderStatusEnum('status').default('PENDING').notNull(),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  tax: decimal('tax', { precision: 10, scale: 2 }).notNull(),
  discount: decimal('discount', { precision: 10, scale: 2 }).default('0.00').notNull(),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const orderItems = pgTable('order_items', {
  id: varchar('id', { length: 12 }).primaryKey(),
  orderId: varchar('order_id', { length: 12 })
    .references(() => orders.id)
    .notNull(),
  itemId: varchar('item_id', { length: 12 })
    .references(() => items.id)
    .notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
});

export const orderModifiers = pgTable('order_modifiers', {
  id: varchar('id', { length: 12 }).primaryKey(),
  orderItemId: varchar('order_item_id', { length: 12 })
    .references(() => orderItems.id)
    .notNull(),
  modifierId: varchar('modifier_id', { length: 12 })
    .references(() => modifiers.id)
    .notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  items: many(items),
}));

export const itemsRelations = relations(items, ({ one, many }) => ({
  category: one(categories, {
    fields: [items.categoryId],
    references: [categories.id],
  }),
  modifiers: many(modifiers),
  orderItems: many(orderItems),
}));

export const modifiersRelations = relations(modifiers, ({ one }) => ({
  item: one(items, {
    fields: [modifiers.itemId],
    references: [items.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  orderItems: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one, many }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  item: one(items, {
    fields: [orderItems.itemId],
    references: [items.id],
  }),
  orderModifiers: many(orderModifiers),
}));

export const orderModifiersRelations = relations(orderModifiers, ({ one }) => ({
  orderItem: one(orderItems, {
    fields: [orderModifiers.orderItemId],
    references: [orderItems.id],
  }),
  modifier: one(modifiers, {
    fields: [orderModifiers.modifierId],
    references: [modifiers.id],
  }),
}));
