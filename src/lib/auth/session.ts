import { db } from '@/db';
import { sessions, users } from '../../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { createHmac, timingSafeEqual } from 'crypto';

const SESSION_COOKIE_NAME = 'pos_session';
const AUTH_SECRET = process.env.AUTH_SECRET || 'fallback-secret-at-least-32-chars';

export { SESSION_COOKIE_NAME };

function sign(payload: string): string {
  const signature = createHmac('sha256', AUTH_SECRET)
    .update(payload)
    .digest('base64url');
  return `${payload}.${signature}`;
}

function verify(token: string): string | null {
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  const expectedSignature = createHmac('sha256', AUTH_SECRET)
    .update(payload)
    .digest('base64url');

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) return null;

  return payload;
}

export async function createSession(userId: string) {
  const sessionId = nanoid(32);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    expiresAt,
  });

  return { sessionId: sign(sessionId), expiresAt };
}

export async function validateSession(token: string) {
  const sessionId = verify(token);
  if (!sessionId) return { session: null, user: null };

  const [session] = await db
    .select({
      id: sessions.id,
      userId: sessions.userId,
      expiresAt: sessions.expiresAt,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      },
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, sessionId));

  if (!session) {
    return { session: null, user: null };
  }

  if (Date.now() >= session.expiresAt.getTime()) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
    return { session: null, user: null };
  }

  // Refresh session if it's close to expiring
  if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 3.5) {
    const nextExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
    await db
      .update(sessions)
      .set({ expiresAt: nextExpiresAt })
      .where(eq(sessions.id, sessionId));
    session.expiresAt = nextExpiresAt;
  }

  return { session, user: session.user };
}

export async function invalidateSession(token: string) {
  const sessionId = verify(token);
  if (sessionId) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
  }
}
