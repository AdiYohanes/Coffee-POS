import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../drizzle/schema';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL is not defined in environment variables');
}

// Disable prefetch as it is not supported for "Transaction" mode
export const client = postgres(connectionString!, { prepare: false });
export const db = drizzle(client, { schema });
