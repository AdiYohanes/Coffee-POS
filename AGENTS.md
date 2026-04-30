<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 🤖 Coffee POS - Agent Context Document

## 📌 Project Context
You are working on **Coffee POS**, a lightweight, modern Point of Sale application built specifically for coffee shops. 
It uses Next.js 16 (App Router), React 19, Tailwind CSS v4, Zustand, TanStack React Query, NextAuth.js (v5 Beta), Drizzle ORM, and PostgreSQL.

## 📐 Architecture & Principles
- **Server Actions over API Routes**: All database mutations and queries are handled via Next.js Server Actions. Ensure `use server` is placed at the top of action files, and functions are exported correctly.
- **Client/Server Component Split**: Follow strict React 19 conventions. Use `"use client"` only when necessary for hooks, state, or interactivity. Keep data fetching on the server.
- **State Management**:
  - `Zustand` is used for client-side transient state (e.g., the active shopping cart in the POS interface).
  - `TanStack Query` is used for caching, invalidation, and optimistic UI updates when interacting with Server Actions.
- **Database Rules**:
  - The schema is located in `drizzle/schema.ts`.
  - Always use parameterized queries or Drizzle's query builder to prevent SQL injection.
  - Ensure strict TypeScript typing matching the DB schema. Avoid implicit or explicit `any`.
- **Styling**:
  - Use Tailwind CSS v4. Avoid custom CSS files unless necessary for print media queries (e.g., thermal receipts).
  - Utilize `clsx` and `tailwind-merge` for dynamic class assignment.

## 🔐 Authentication & Access
- Handled by Auth.js (`next-auth@beta`). 
- **Roles**: ADMIN, CASHIER, BARISTA. Always check user roles at the Server Action level before executing mutations or returning sensitive data.

## 🎯 Current Project State
The project has successfully completed Phases 1-5, reaching production readiness.
- POS cart, reporting, voiding, and order queues are fully implemented.
- Sentry is integrated for error monitoring.
- The app is successfully deployed on Vercel.
- Lighthouse scores have been optimized for Performance, Accessibility, Best Practices, and SEO.

When modifying code, ensure you do not break the strict TypeScript compilation and maintain high-quality UI/UX.
