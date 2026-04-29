import * as dotenv from 'dotenv';
dotenv.config();

import { db } from './index';
import { users, categories, items } from '../../drizzle/schema';
import { nanoid } from 'nanoid';
import { hash } from '@node-rs/argon2';

const seed = async () => {
  console.log('🌱 Seeding database...');

  // 1. Create Admin User
  const adminId = nanoid(12);
  const adminPasswordHash = await hash('Admin@123456');
  await db.insert(users).values({
    id: adminId,
    name: 'Admin User',
    email: 'admin@coffeepos.com',
    passwordHash: adminPasswordHash,
    role: 'ADMIN',
  }).onConflictDoNothing();

  // 2. Create Category
  const categoryId = nanoid(12);
  await db.insert(categories).values({
    id: categoryId,
    name: 'Coffee',
    sortOrder: 1,
  }).onConflictDoNothing();

  // 3. Create Items
  const coffeeItems = [
    { name: 'Espresso', price: '3.00' },
    { name: 'Latte', price: '4.50' },
    { name: 'Cappuccino', price: '4.00' },
  ];

  for (const item of coffeeItems) {
    await db.insert(items).values({
      id: nanoid(12),
      categoryId: categoryId,
      name: item.name,
      basePrice: item.price,
    }).onConflictDoNothing();
  }

  console.log('✅ Seeding completed');
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seeding failed');
  console.error(err);
  process.exit(1);
});
