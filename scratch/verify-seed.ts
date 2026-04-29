import { db } from '../src/db/index';
import { users, categories, items } from '../drizzle/schema';

async function verify() {
  const allUsers = await db.select().from(users);
  const allCategories = await db.select().from(categories);
  const allItems = await db.select().from(items);

  console.log('--- Users ---');
  console.table(allUsers);
  console.log('--- Categories ---');
  console.table(allCategories);
  console.log('--- Items ---');
  console.table(allItems);

  process.exit(0);
}

verify().catch(console.error);
