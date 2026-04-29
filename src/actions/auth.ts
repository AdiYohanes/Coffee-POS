"use server";

import { z } from "zod";
import { db } from "@/db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { verify } from "@node-rs/argon2";
import { 
  createSession, 
  setSessionTokenCookie, 
  getCurrentSession, 
  invalidateSession, 
  deleteSessionTokenCookie 
} from "@/lib/auth/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type AuthResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function loginAction(
  _prevState: AuthResponse,
  formData: FormData
): Promise<AuthResponse> {
  const values = {
    email: formData.get('email')?.toString().trim() || '',
    password: formData.get('password')?.toString() || '',
  };
  const validated = loginSchema.safeParse(values);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  const { email, password } = validated.data;

  try {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) {
      return { success: false, error: "Invalid credentials" };
    }

    const validPassword = await verify(user.passwordHash, password);
    if (!validPassword) {
      return { success: false, error: "Invalid credentials" };
    }

    const { sessionId, expiresAt } = await createSession(user.id);
    await setSessionTokenCookie(sessionId, expiresAt);

    // Redirect after setting cookie
    redirect('/pos');
  } catch (error) {
    console.error("Login error:", error);
    // Rethrow redirect if Next.js throws it
    if (error && typeof error === 'object' && 'digest' in error && (error as any).digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function logoutAction(): Promise<AuthResponse> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("pos_session")?.value;
  
  if (sessionId) {
    await invalidateSession(sessionId);
  }
  
  await deleteSessionTokenCookie();
  return { success: true };
}

export async function getSessionAction(): Promise<AuthResponse> {
  try {
    const { session, user } = await getCurrentSession();
    
    if (!session || !user) {
      return { success: false, error: "Unauthorized" };
    }

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role.toLowerCase() as "admin" | "cashier" | "barista",
        },
        expires: session.expiresAt.toISOString(),
      },
    };
  } catch (error) {
    return { success: false, error: "Session validation failed" };
  }
}
