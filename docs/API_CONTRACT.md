# Coffee POS API Contract & Architecture

## Workflow Phases
- Phase 1: Database Setup & Core Architecture (Scaffolding, Routing, DB Connection)
- Phase 2: Authentication & Role-Based Access Control (Session Management, Middleware)
- Phase 3: Menu & Catalog Management (Categories, Items, Modifiers CRUD)
- Phase 4: Order Flow & POS Interface (Cart State, Offline Sync, Checkout)
- Phase 5: Dashboard & Barista Queue (Analytics, Real-time status updates)

## Drizzle Schema Outline

| Table | Columns | Relations | Indexes | Soft-Delete |
| --- | --- | --- | --- | --- |
| users | id, name, email, role, created_at, updated_at | orders | email | yes (deleted_at) |
| categories | id, name, sort_order, created_at | items | sort_order | yes |
| items | id, category_id, name, base_price, image_url, created_at | category, modifiers, order_items | category_id | yes |
| modifiers | id, item_id, name, additional_price, created_at | item | item_id | yes |
| orders | id, user_id, status, subtotal, tax, discount, total, created_at | user, order_items | status, created_at | no (use void status) |
| order_items | id, order_id, item_id, quantity, unit_price, subtotal | order, item | order_id | no |
| order_modifiers | id, order_item_id, modifier_id, price | order_item, modifier | order_item_id | no |

## Role-Based Access Rules

| Role | Permissions | Excluded Areas |
| --- | --- | --- |
| Cashier | Create orders, Hold/Void own orders, Read menu | Dashboard, Menu Editing |
| Barista | Read active orders, Update order status (pending -> done) | Checkout, Dashboard, Menu Editing |
| Admin | Full access to CRUD menu, Read all orders, View dashboard | None |

## Server Actions

| Action Name | Input Shape | Output Shape | DB Tables Touched | Allowed Roles |
| --- | --- | --- | --- | --- |
| getCategories | None | Array of Categories | categories | All |
| createCategory | name, sort_order | Category | categories | Admin |
| updateCategory | id, name, sort_order | Category | categories | Admin |
| deleteCategory | id | Boolean | categories | Admin |
| getItems | category_id (optional) | Array of Items | items, modifiers | All |
| createItem | category_id, name, base_price, image_url | Item | items | Admin |
| updateItem | id, category_id, name, base_price | Item | items | Admin |
| deleteItem | id | Boolean | items | Admin |
| createOrder | items[], modifiers[], discount | Order | orders, order_items, order_modifiers | Cashier, Admin |
| updateOrderStatus | id, status | Order | orders | Barista, Admin |
| voidOrder | id, reason | Order | orders | Cashier, Admin |
| getActiveOrders | None | Array of Orders | orders, order_items | Barista, Admin |
| getDailyStats | date | Stats Object | orders | Admin |

## Dependencies (Next.js 15 Stack)

- Framework: next@15, react@19, react-dom@19
- ORM & Database: drizzle-orm, drizzle-kit, postgres
- UI & Styling: tailwindcss, postcss, autoprefixer, lucide-react, clsx, tailwind-merge, class-variance-authority
- State Management: zustand
- Data Fetching: @tanstack/react-query
- Authentication: next-auth@beta
- Utilities: nanoid, date-fns

## Environment Variables

- DATABASE_URL
- AUTH_SECRET
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
