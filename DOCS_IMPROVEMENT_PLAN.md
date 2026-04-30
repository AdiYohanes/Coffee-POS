- **Environment Variables Reference** (Missing)
- **Server Actions Contract Table** (Missing)
- **Caching / Revalidation Map** (Missing)
- **Error Handling & Data Flow** (Missing)
- **POS Keyboard Shortcuts Spec** (Missing)
- **Known Limitations (v1) / Tech Debt** (Missing)
- **Pre-deploy Checklist + Rollback** (Weak)

| Section            | Target README Location               | Required Detail Level                                                     | Dependencies              | Validation Rule                                  |
| ------------------ | ------------------------------------ | ------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------ |
| **Env Variables**  | Under `## Getting Started`           | Table of keys, types, required flags, and safe defaults.                  | `src/lib/env.ts`, `.env`  | Must exactly match Zod schema in `env.ts`.       |
| **Server Actions** | New `## API Contract`                | Table mapping functions to args, return types, and RBAC roles.            | `docs/API_CONTRACT.md`    | Types must compile against `src/lib/actions/`.   |
| **Caching Map**    | New `## State & Caching`             | Query keys, mutation invalidators, and Server Action tags.                | `@PHASE4_CONTRACT.md`     | Keys must match TanStack/Next.js tags in code.   |
| **Error Flow**     | Under `## State & Caching`           | Sentry capture boundaries, Zod failures, and Toast UI states.             | `docs/PHASE5_CONTRACT.md` | Must align with Sentry configuration.            |
| **Shortcuts**      | New `## POS Interface`               | Key combinations mapped to specific POS functions (e.g., Void, Checkout). | `AGENTS.md`               | Verified by triggering browser `keydown` events. |
| **Tech Debt**      | New `## Known Limitations`           | Specific deferred items (e.g., mock latency, pagination limits).          | `AGENTS.md`               | Linked to specific `// TODO:` comments in code.  |
| **Pre-deploy**     | Overwrite `## 🚀 Production Runbook` | Explicit CLI commands, manual QA steps, and rollback flags.               | `docs/PHASE5_CONTRACT.md` | All CLI commands must be executable and valid.   |
