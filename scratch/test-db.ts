import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  console.log('Testing connection to:', process.env.DATABASE_URL);
  const sql = postgres(process.env.DATABASE_URL!);
  try {
    const result = await sql`SELECT version()`;
    console.log('Connection successful!');
    console.log('Version:', result[0].version);
  } catch (error) {
    console.error('Connection failed:', error);
  } finally {
    await sql.end();
  }
}

testConnection();
