# ☕ Coffee POS

Coffee POS is a modern, lightweight, and high-performance Point of Sale application designed specifically for coffee shops. Built on Next.js 16 (App Router), it features a highly optimized checkout flow, robust role-based authentication, interactive reporting dashboards, and real-time order tracking.

## 📖 What is this app?

This application serves as the core operational software for a coffee shop environment. It replaces traditional cash registers with a web-based, cloud-ready solution that can run on any device with a web browser (tablets, desktops, or dedicated POS hardware).

## ⚙️ How this app works

The system utilizes a modern architecture leveraging the Next.js App Router:

- **Client-Side (Zustand & TanStack Query)**: The frontend manages the highly interactive POS interface (cart state, menu browsing, active orders) using Zustand for immediate, transient UI updates, and TanStack React Query for caching and synchronizing data seamlessly.
- **Server-Side (Server Actions & Drizzle ORM)**: All database mutations (creating orders, updating status, voiding) and queries are handled securely via Next.js Server Actions. Data is persisted to a PostgreSQL database using Drizzle ORM.
- **Authentication**: Access is strictly controlled via NextAuth.js (Auth.js) using role-based access control (Admin, Cashier, Barista) to ensure users only see the interfaces they are authorized to use.

## ✨ Features

- **POS Interface**: A dynamic, responsive menu grid with categories and real-time cart state management. Features optimistic UI updates for rapid checkout processes.
- **Order Queue**: Live tracking of PENDING and DONE orders, essential for seamless communication between cashiers and baristas.
- **Reporting & Voiding**: Comprehensive sales dashboards visualized with Recharts, detailed transaction history, and strict workflows for voiding orders to maintain financial integrity.
- **Print-Ready Receipts**: Optimized CSS styling specifically designed for printing standard thermal POS receipts.
- **Production Ready**: Fully equipped with automated health checks, Sentry integration for error reporting, and optimized for performance, accessibility, best practices, and SEO.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

### 🔐 Environment Variables

<!-- AUTO-GENERATED: DO NOT EDIT MANUALLY -->

| Key                   | Type   | Required | Default       | Description                            |
| :-------------------- | :----- | :------- | :------------ | :------------------------------------- |
| `DATABASE_URL`        | `url`  | Yes      | -             | PostgreSQL connection string           |
| `SENTRY_DSN`          | `url`  | No       | -             | Sentry error monitoring DSN            |
| `NODE_ENV`            | `enum` | No       | `development` | Runtime mode (development, production) |
| `NEXT_PUBLIC_APP_URL` | `url`  | No       | -             | Public application base URL            |

## 🔄 API Contract (Server Actions)

<!-- AUTO-GENERATED: DO NOT EDIT MANUALLY -->

| Action                    | Input (Zod)                   | Output                             | Role           |
| :------------------------ | :---------------------------- | :--------------------------------- | :------------- |
| `loginAction`             | `{ email, password }`         | `AuthResponse`                     | Public         |
| `getMenuAction`           | `None`                        | `ActionResponse<Category[]>`       | All            |
| `createOrderAction`       | `{ items, totalAmount, ... }` | `ActionResponse<{ orderId }>`      | Cashier, Admin |
| `updateOrderStatusAction` | `{ orderId, status }`         | `ActionResponse`                   | Barista, Admin |
| `getDailySalesAction`     | `{ start, end }`              | `ActionResponse<DailySalesData[]>` | Admin          |
| `voidOrderAction`         | `{ orderId, reason }`         | `ActionResponse<Order>`            | Cashier, Admin |
| `getReceiptDataAction`    | `{ orderId }`                 | `ActionResponse<ReceiptData>`      | All            |

## 🧠 State & Caching

<!-- AUTO-GENERATED: DO NOT EDIT MANUALLY -->

### Caching Strategy

| Key / Tag | Scope          | Strategy                    | Invalidated By                                 |
| :-------- | :------------- | :-------------------------- | :--------------------------------------------- |
| `reports` | TanStack Query | `staleTime: 5m`             | `voidOrderAction`                              |
| `orders`  | TanStack Query | `revalidatePath('/orders')` | `voidOrderAction`                              |
| `pos`     | TanStack Query | `revalidatePath('/pos')`    | `createOrderAction`, `updateOrderStatusAction` |

### Error Handling & Data Flow

- **Observability**: `@sentry/nextjs` integrated in `instrumentation.ts`. Traces: 10%, Replays: 100% on error.
- **Validation**: Strict Zod schemas in `src/lib/actions/`. All failures return user-friendly strings.
- **UI States**: `sonner` for transactional toasts; React Error Boundaries for critical failures.

## ⌨️ POS Interface

<!-- AUTO-GENERATED: DO NOT EDIT MANUALLY -->

### Keyboard Shortcuts

| Shortcut | Action               | Condition                         |
| :------- | :------------------- | :-------------------------------- |
| `F2`     | **Process Checkout** | Cart must have at least one item  |
| `Escape` | **Clear Cart**       | Cart drawer active, no modal open |

## ⚠️ Known Limitations

<!-- AUTO-GENERATED: DO NOT EDIT MANUALLY -->

- **Latency**: Checkout uses a simulated delay to ensure transaction integrity.
- **Pooling**: Drizzle connected via Neon pooler; max 5 concurrent connections/instance.
- **Void Reason**: Audit logs reasons to `stdout`; not currently persisted in DB schema.
- **Pagination**: Order history results are capped at the latest 100 entries.

## 🚀 Production Runbook

<!-- AUTO-GENERATED: DO NOT EDIT MANUALLY -->

### Deployment

1. **Link to Vercel**: `vercel link`
2. **Environment Setup**: Ensure all variables in `src/lib/env.ts` are set in Vercel settings.
3. **Pre-deploy Check**: Run `./scripts/deploy-checklist.sh` to verify types and lints.
4. **Deploy**: `vercel --prod`

### Rollback Strategy

- **Vercel Instant**: Navigate to Vercel Dashboard -> Deployments -> Rollback to stable version.
- **Git Revert**: Revert problematic commit on `main` and push to trigger automated CI/CD.

### Monitoring & Health

- **Sentry**: Real-time error tracking and performance tracing at [sentry.io](https://sentry.io).
- **Health Endpoint**: Monitor system vitals via `GET /api/health`.
- **Database**: Monitor Neon connection limits and query performance via dashboard.
