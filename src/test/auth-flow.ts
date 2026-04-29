import { createSession, validateSession, invalidateSession } from '../lib/auth/session';
import { hash } from '@node-rs/argon2';
import { db } from '../db';
import { users, sessions } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

async function runTest() {
  console.log('🚀 Starting Auth Flow Test...');

  // 1. Setup Mock User
  const testEmail = `test-${nanoid(5)}@example.com`;
  const password = 'password123';
  const passwordHash = await hash(password);
  const userId = nanoid(12);

  console.log(`Step 1: Creating test user ${testEmail}...`);
  await db.insert(users).values({
    id: userId,
    name: 'Test User',
    email: testEmail,
    passwordHash: passwordHash,
    role: 'ADMIN',
  });

  try {
    // 2. Simulate Login (Create Session)
    console.log('Step 2: Simulating login (creating session)...');
    const { sessionId, expiresAt } = await createSession(userId);
    console.log(`✅ Session created: ${sessionId}`);

    // 3. Validate Session
    console.log('Step 3: Validating session...');
    const { session, user } = await validateSession(sessionId);
    
    if (session && user) {
      console.log(`✅ Session is valid for user: ${user.name} (${user.role})`);
      if (user.role === 'ADMIN') {
        console.log('✅ Role check passed: User is ADMIN');
      } else {
        throw new Error('❌ Role check failed');
      }
    } else {
      throw new Error('❌ Session validation failed');
    }

    // 4. Invalidate Session (Logout)
    console.log('Step 4: Simulating logout (invalidating session)...');
    await invalidateSession(sessionId);
    
    const { session: deletedSession } = await validateSession(sessionId);
    if (!deletedSession) {
      console.log('✅ Session successfully invalidated');
    } else {
      throw new Error('❌ Session still exists after invalidation');
    }

    console.log('\n✨ All tests passed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await db.delete(sessions).where(eq(sessions.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
    console.log('Done.');
    process.exit(0);
  }
}

runTest();
