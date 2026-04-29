# Coffee POS - v1

## Core Scope

- Multi-role: Cashier (POS), Barista (Order Queue), Admin (Reports)
- Menu management: Category, Item, Price, Modifiers (size, milk, sugar)
- Order flow: Add to cart → Apply discount/tax → Checkout → Print/Save receipt
- Offline fallback: LocalStorage cart sync when reconnecting
- Dashboard: Daily sales, top items, void/hold orders

## Tech Constraints

- Next.js 15 App Router + TypeScript
- Server Actions for data mutations
- Drizzle ORM + PostgreSQL (Supabase)
- shadcn/ui + Tailwind dark theme (coffee palette: #0B090A, #1C161A, #8B5CF6)
- Role-based route protection

## API Contract Rule

All server actions return: `{ success: boolean, data?: T, error?: string }`
Dates: ISO 8601 UTC. Money: `DECIMAL(10,2)`. IDs: `VARCHAR(12)` (nanoid).

## Out of Scope v1

- Payment gateway integration
- Inventory tracking
- Multi-branch sync
- Customer CRM
