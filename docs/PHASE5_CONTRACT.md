# Phase 5: Production Deploy, Monitoring & Handoff Contract

## Vercel Deployment Strategy

*   **Runtime Environments:**
    *   **Node.js Runtime (Default):** Used for standard API routes, Server Actions, and SSR pages. Provides full Node.js API support.
    *   **Edge Runtime:** Used for Middleware (e.g., Auth, Rate Limiting) for ultra-low latency. Strict limitations on Node.js APIs apply.
*   **Serverless Limits:**
    *   Execution Timeout: 10s (Hobby) / 15s (Pro, configurable up to 300s).
    *   Memory: 1024MB (Hobby) / Configurable up to 3008MB (Pro).
    *   Payload Size: 4.5MB maximum request/response payload size.
*   **Server Actions Configuration:**
    *   Set `maxDuration` at the route/action level (e.g., `export const maxDuration = 15;`) to prevent timeouts during complex DB transactions or heavy report generation.

## Database Connection Pooling Strategy

*   **Infrastructure:** Serverless databases (e.g., Neon Postgres, Supabase) using connection poolers like PgBouncer or native HTTP/WebSocket drivers.
*   **Drizzle ORM Configuration:**
    *   Must use transaction-aware pooling.
    *   Connect via the pooler connection string (e.g., ends with `?pgbouncer=true` or similar pooler parameters).
    *   Keep `max` connection pool size per serverless function instance low (e.g., 1-5) to avoid exhausting the database connection limit across multiple concurrent Vercel invocations.

## Environment Security

*   **`.env` Validation:**
    *   Validate all required environment variables at startup using `zod`.
    *   Block app initialization/build if required variables (e.g., `DATABASE_URL`, `SESSION_SECRET`) are missing or malformed.
*   **`NODE_ENV` Behavior:**
    *   Strictly separate `development`, `preview`, and `production` environments via Vercel Project Settings.
*   **Secrets Rotation Policy:**
    *   Manual rotation for database passwords and API keys every 90 days.
    *   Immediate rotation upon suspected compromise or team offboarding.
    *   Update Vercel environment variables and trigger a redeployment.

## Monitoring Contract (Sentry)

*   **Instrumentation:**
    *   `@sentry/nextjs` integrated into `instrumentation.ts` for Next.js 15 App Router.
    *   Wrappers for Server Actions to capture unhandled exceptions and execution context.
    *   Frontend Error Boundaries connected to Sentry.
*   **Sampling & Tracing:**
    *   `tracesSampleRate`: 0.1 (10%) for performance monitoring to avoid quota exhaustion.
    *   `replaysSessionSampleRate`: 0.01 (1%) for session replays; `replaysOnErrorSampleRate`: 1.0 (100%) to capture replays only on errors.
*   **PII Masking Rules:**
    *   Mask all password fields, authentication tokens, and session identifiers.
    *   Anonymize user IP addresses by default.
    *   Sanitize database query logs to remove sensitive user input.

## Health Check Contract

*   **Endpoint:** `GET /api/health`
*   **Response Shape:**
    *   Status: 200 OK
    *   JSON:
        *   `status`: "healthy" | "unhealthy"
        *   `timestamp`: "ISO-8601 string"
        *   `uptime`: number (seconds)
        *   `database`: "connected" | "disconnected"
*   **Verification:**
    *   Performs a lightweight `SELECT 1` ping to the database.
    *   Returns 503 Service Unavailable if the database connection fails.

## CI/CD & Rollback Strategy

*   **Routing:**
    *   Commits to `main` auto-deploy to `production`.
    *   Commits to feature branches auto-deploy to unique `preview` URLs.
*   **Build Validation:**
    *   Type checking, linting, and environment validation must pass during the Vercel build step.
    *   Automatic deployment cancellation/failure if any build step fails.
*   **Rollback Procedures:**
    *   **Automatic:** Handled by Vercel if the build command exits with a non-zero code.
    *   **Manual (Instant):** Navigate to Vercel Deployments dashboard -> Select previous successful deployment -> Click "Rollback" / "Promote to Production".
    *   **Manual (Code):** `git revert` the problematic commit and push to `main` to trigger a new build workflow.

## Vercel Configuration Rules (`vercel.json` or `next.config.mjs`)

| Rule Type | Configuration Details |
| :--- | :--- |
| **Security Headers** | `X-Frame-Options: DENY` |
| | `X-Content-Type-Options: nosniff` |
| | `Referrer-Policy: origin-when-cross-origin` |
| | `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` |
| | `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.sentry.io;` |
| **Cache Control** | Static Assets (Images, Fonts, etc.): `Cache-Control: public, max-age=31536000, immutable` |
| **Rewrites** | Standard Next.js App Router internal rewrites. |

## Required Dependencies

*   `@sentry/nextjs`
*   `@vercel/analytics`
*   `dotenv`
*   `zod`

## Handoff Documentation Structure (`README.md` Runbook)

*   **System Overview:** Tech stack summary, high-level architecture, and core modules.
*   **Deployment Runbook:** Step-by-step Vercel deployment guide and environment variable checklist.
*   **Monitoring & Alerts:** How to access Sentry, interpret common errors, and check Vercel application logs.
*   **Database Management (v1):**
    *   **Backup:** Manual export via database provider's dashboard (e.g., Neon/Supabase).
    *   **Restore:** Manual import from SQL dump.
    *   **Migrations:** Running `drizzle-kit push` or `drizzle-kit migrate` safely against production.
*   **Scaling Limits (v1 Scope):** Acknowledge limitations like single-region deployment, database connection pool limits under high concurrency, and Vercel serverless function timeouts.
