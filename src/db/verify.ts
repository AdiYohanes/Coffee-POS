import { db } from './index';
import { users, items } from '../../drizzle/schema';
import * as dotenv from 'dotenv';

dotenv.config();

async function verify() {
  const allUsers = await db.select().from(users);
  const allItems = await db.select().from(items);

  console.log('--- Database Verification ---');
  console.log(`Users count: ${allUsers.length}`);
  console.log(`Items count: ${allItems.length}`);
  console.log('Sample User:', allUsers[0]?.email);
  console.log('Sample Item:', allItems[0]?.name);
  console.log('-----------------------------');
  
  process.exit(0);
}

verify().catch(console.error);
