import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  SENTRY_DSN: z.string().url().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:", JSON.stringify(_env.error.format(), null, 2));
  throw new Error("Invalid environment variables");
}

export const env = _env.data;
