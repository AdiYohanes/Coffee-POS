# ☕ Coffee POS - Technical Documentation & Summary

## 📌 Project Overview
Coffee POS is a modern, high-performance Point of Sale application designed for coffee shops. Built on Next.js 16 (App Router), it features a highly optimized checkout flow, robust role-based authentication, interactive dashboards, and real-time order tracking.

## 🚀 Tech Stack
- **Framework**: Next.js 16.2 (App Router, Server Actions, Server Components)
- **Frontend**: React 19, Tailwind CSS v4, Radix UI, Lucide React
- **State Management**: Zustand (client state/cart), TanStack React Query v5 (server state caching)
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM (with `postgres.js`)
- **Authentication**: NextAuth.js (v5 Beta)
- **Validation**: Zod
- **Data Visualization**: Recharts
- **Error Tracking**: Sentry (`@sentry/nextjs`)
- **Deployment**: Vercel

## 📂 Project Structure
- `src/app/`: Next.js App Router routes (login, pos, orders, reports, etc.)
- `src/components/`: Reusable React components
- `src/lib/`: Utilities, constants, and Zod schemas
- `src/db/`: Database configuration and seed scripts
- `drizzle/schema.ts`: Database schema definitions and relations

## 🗄️ Database Architecture (Drizzle ORM)
The database follows a highly normalized relational structure:

1. **`users`**: Manages accounts. Fields: `id`, `name`, `email`, `passwordHash`, `role` (ADMIN, CASHIER, BARISTA).
2. **`sessions`**: Active user sessions.
3. **`categories`**: Menu categories (e.g., Coffee, Pastry) with `sortOrder`.
4. **`items`**: Menu items with `basePrice` and `categoryId`.
5. **`modifiers`**: Customizable options (e.g., "Oat Milk", "Extra Shot") tied to an `itemId` with an `additionalPrice`.
6. **`orders`**: Tracks transactions. Fields: `status` (PENDING, DONE, VOID), financials (`subtotal`, `tax`, `discount`, `total`), and cashier `userId`.
7. **`order_items`**: Line items for an order, tracking `quantity`, `unitPrice`, and `subtotal`.
8. **`order_modifiers`**: Specific modifiers applied to an `order_item`.

### Key Relationships:
- `users` (1) ↔ (N) `orders`
- `categories` (1) ↔ (N) `items`
- `items` (1) ↔ (N) `modifiers`
- `orders` (1) ↔ (N) `orderItems`
- `orderItems` (1) ↔ (N) `orderModifiers`

## 🔐 Authentication & Roles
- **Authentication System**: Utilizes NextAuth.js (Auth.js v5 beta) with credentials provider (Argon2 hashing).
- **Roles**:
  - `ADMIN`: Full access to reports, menu management, and user creation.
  - `CASHIER`: Access to POS for taking orders, voiding, and queue management.
  - `BARISTA`: Access to the order queue to fulfill active orders.

## 🛒 Core Features
1. **POS Interface**:
   - Dynamic menu grid with categories.
   - Real-time cart state managed by Zustand.
   - Optimistic UI updates with React Query during checkout.
2. **Order Queue**:
   - Live tracking of PENDING and DONE orders.
   - State invalidation and caching to reduce DB load.
3. **Reporting & Voiding**:
   - Sales dashboards visualized with Recharts.
   - Transaction history with detailed receipt viewing.
   - Strict voiding workflows to maintain financial integrity.
4. **Print-Ready Receipts**:
   - CSS media queries optimized specifically for standard thermal POS printers.
5. **Production Ready**:
   - Automated health checks (`/api/health`).
   - Sentry integration for error reporting and performance tracing.
   - Fully optimized Lighthouse scores (Performance, Accessibility, Best Practices, SEO).

## 🛠️ Local Development Setup
```bash
# Install dependencies
npm install

# Set up environment
# Ensure DATABASE_URL, AUTH_SECRET, etc. are set in .env

# Run database migrations
npx drizzle-kit push

# Seed initial data (Admin: admin@coffeepos.com / Admin@123456)
npm run seed

# Start development server
npm run dev
```

---
*This document serves as the high-level project summary and truth-source for the Coffee POS architecture.*
