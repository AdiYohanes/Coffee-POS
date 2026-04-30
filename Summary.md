# Coffee POS Application Summary

## Overview

Coffee POS is a lightweight, modern Point of Sale application designed specifically for coffee shops. Built using Next.js, it provides seamless order management, real-time cart functionality, reporting, and role-based access control.

## Tech Stack

- **Framework:** Next.js 16.2 (App Router)
- **Frontend/UI:** React 19, Tailwind CSS v4, Radix UI primitives, Lucide React
- **State Management:** Zustand (client state), TanStack React Query (server state & caching)
- **Database & ORM:** PostgreSQL, Drizzle ORM, Postgres.js
- **Authentication:** NextAuth.js (beta)
- **Validation:** Zod
- **Data Visualization:** Recharts

## Features

- **Role-Based Authentication:** Support for ADMIN, CASHIER, and BARISTA roles.
- **Menu Management:** Structured categories and items, including item-specific modifiers.
- **POS Operations:** Real-time cart calculation, order placement, and status updates.
- **Order Tracking:** Lifecycle management (PENDING, DONE, VOID).
- **Reporting & Dashboards:** Transaction insights and visualizations.
- **Print-ready Receipts:** CSS media queries optimized for POS thermal printers.

## Architecture

- **Client-Server Paradigm:** Leverages React Server Components for data fetching and Server Actions for mutations.
- **State Synchronization:** Optimistic UI updates with React Query to ensure a snappy user experience, especially during checkout flows.
- **Relational Integrity:** Strong typing from the database schema up to the client components.

## Setup

```bash
# Install dependencies
npm install

# Setup environment variables
# Define DATABASE_URL in .env

# Run database migrations and seeding
npx drizzle-kit push
npm run seed

# Start development server
npm run dev
```

## Database

### Schema Details

```typescript
// Enums
enum role { 'CASHIER', 'BARISTA', 'ADMIN' }
enum order_status { 'PENDING', 'DONE', 'VOID' }

// Tables & Columns
users
  - id: varchar(12) [PK]
  - name: varchar(255)
  - email: varchar(255) [UNIQUE]
  - passwordHash: varchar(255)
  - role: enum(role)
  - createdAt, updatedAt, deletedAt: timestamp

sessions
  - id: varchar(255) [PK]
  - userId: varchar(12) [FK -> users.id]
  - expiresAt: timestamp

categories
  - id: varchar(12) [PK]
  - name: varchar(255)
  - sortOrder: integer
  - createdAt, deletedAt: timestamp

items
  - id: varchar(12) [PK]
  - categoryId: varchar(12) [FK -> categories.id]
  - name: varchar(255)
  - basePrice: decimal(10,2)
  - imageUrl: varchar(1024)
  - createdAt, deletedAt: timestamp

modifiers
  - id: varchar(12) [PK]
  - itemId: varchar(12) [FK -> items.id]
  - name: varchar(255)
  - additionalPrice: decimal(10,2)
  - createdAt, deletedAt: timestamp

orders
  - id: varchar(12) [PK]
  - userId: varchar(12) [FK -> users.id]
  - status: enum(order_status) [default: PENDING]
  - subtotal, tax, discount, total: decimal(10,2)
  - createdAt: timestamp

order_items
  - id: varchar(12) [PK]
  - orderId: varchar(12) [FK -> orders.id]
  - itemId: varchar(12) [FK -> items.id]
  - quantity: integer
  - unitPrice, subtotal: decimal(10,2)

order_modifiers
  - id: varchar(12) [PK]
  - orderItemId: varchar(12) [FK -> order_items.id]
  - modifierId: varchar(12) [FK -> modifiers.id]
  - price: decimal(10,2)
```

### ERD Description & Relationships

The database follows a highly normalized relational model designed for consistency and tracking:

- **`users` ↔ `orders`**: (1:N) A user (Cashier/Admin) can process many orders.
- **`categories` ↔ `items`**: (1:N) Each category contains multiple items.
- **`items` ↔ `modifiers`**: (1:N) Specific items can have customizable options (e.g., extra shot, milk type).
- **`orders` ↔ `order_items`**: (1:N) An order consists of multiple line items.
- **`order_items` ↔ `order_modifiers`**: (1:N) Each line item can optionally include applied modifiers.

### Indexes

- **Primary Keys**: Automatically indexed (e.g., `id` fields across all tables).
- **Unique Constraints**: `users.email` is strictly unique to prevent duplicate accounts.
- **Foreign Keys**: Implicit reference tracking on relations (`userId`, `categoryId`, `itemId`, `orderId`, `orderItemId`, `modifierId`) for cascading integrity.

### Critical Data Examples

#### 1. Menu Example

```json
{
  "category": { "id": "cat-1", "name": "Coffee" },
  "item": {
    "id": "item-1",
    "categoryId": "cat-1",
    "name": "Latte",
    "basePrice": "4.50"
  },
  "modifier": {
    "id": "mod-1",
    "itemId": "item-1",
    "name": "Oat Milk",
    "additionalPrice": "0.50"
  }
}
```

#### 2. Order & Transaction Example

```json
{
  "order": {
    "id": "ord-123",
    "userId": "user-cashier-1",
    "status": "DONE",
    "subtotal": "5.00",
    "tax": "0.50",
    "discount": "0.00",
    "total": "5.50"
  },
  "order_items": [
    {
      "id": "oi-1",
      "orderId": "ord-123",
      "itemId": "item-1",
      "quantity": 1,
      "unitPrice": "4.50",
      "subtotal": "5.00"
    }
  ],
  "order_modifiers": [
    {
      "id": "om-1",
      "orderItemId": "oi-1",
      "modifierId": "mod-1",
      "price": "0.50"
    }
  ]
}
```
