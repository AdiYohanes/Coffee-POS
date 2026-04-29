## Server Action Signatures

| Action Name | Parameters | Return Type | Description |
| :--- | :--- | :--- | :--- |
| `getDailySalesAction` | `startDate: Date, endDate: Date` | `Promise<{ date: string, total: number }[]>` | Retrieves daily sales aggregates within a given date range. |
| `getTopItemsAction` | `limit: number` | `Promise<{ name: string, quantity: number }[]>` | Retrieves the top selling items by quantity. |
| `getOrderHistoryAction` | `filters: { status?: string, date?: Date }` | `Promise<Order[]>` | Fetches order history based on provided filters. |
| `voidOrderAction` | `orderId: string, reason: string` | `Promise<{ success: boolean, error?: string }>` | Voids a specific order and logs the reason. |
| `getReceiptDataAction` | `orderId: string` | `Promise<ReceiptData>` | Fetches comprehensive data required for printing a receipt. |

## Zod Validation Schemas

*   **Void Order Schema**:
    *   `orderId`: `z.string().uuid()`
    *   `reason`: `z.string().min(5, "Reason must be at least 5 characters").max(255)`
*   **Receipt Input Schema**:
    *   `orderId`: `z.string().uuid()`
*   **Date Range Filter Schema**:
    *   `startDate`: `z.date()`
    *   `endDate`: `z.date()`

## Data Aggregation Logic

*   **Group Sales by Day/Category**: Utilize Drizzle's `sql` helper to `DATE_TRUNC('day', createdAt)` and group by category.
*   **Calculate Void Totals**: Sum total amounts where `status = 'VOIDED'`, grouped by `reason`.
*   **Timezone Handling**: Store all timestamps in UTC in the database; aggregate at the database level in UTC, then convert to the local timezone on the client for rendering.

## Component Tree

*   `/reports` (Page)
    *   `DateRangePicker` (Client Component)
    *   `KPICards` (Server/Client Hybrid)
    *   `SalesChart` (Client Component - Recharts)
    *   `TopItemsList` (Server Component)
*   `/orders` (Page)
    *   `OrderHistoryTable` (Server Component with Client interactivity)
    *   `VoidOrderModal` (Client Component - Radix Dialog)
    *   `ReceiptPreview` (Client Component)

## Role Permissions

| Role | Permissions |
| :--- | :--- |
| `admin` | Full access to reports, all orders, and ability to void any order. |
| `cashier` | Access to view their own orders, void their own orders (reason required), print receipts. |
| `barista` | View order queue only. No access to reports or voiding. |

## Receipt Generation Strategy

*   **Trigger**: Use `window.print()` triggered by a user action on the client side.
*   **Layout**: Thermal-friendly layout optimized for 80mm width.
*   **Typography**: Monospace font (e.g., Courier, 'Courier New') for uniform character spacing.
*   **Styling**: Use CSS `@media print` query to override screen styles.
*   **Content**: No images, strict text-based hierarchy (Header, Items, Total, Footer).

## Print CSS Rules

*   **Hide UI Chrome**:
    *   `@media print { nav, sidebar, footer, .no-print { display: none !important; } }`
*   **Force Background & Colors**:
    *   `@media print { * { color: #000 !important; background: transparent !important; box-shadow: none !important; text-shadow: none !important; } }`
*   **Thermal Dimensions**:
    *   `@media print { @page { margin: 0; size: 80mm auto; } }`
    *   `@media print { body { width: 80mm; margin: 0; padding: 5mm; font-family: monospace; font-size: 12px; } }`

## QA & Polish Checklist

*   **Lighthouse Targets**: >90 in Performance, Accessibility, Best Practices, and SEO.
*   **Accessibility (a11y)**: Ensure all interactive elements have `aria-labels`, inputs have associated labels, and focus management is handled in modals.
*   **Error Boundaries**: Implement React Error Boundaries to catch rendering errors in isolated components.
*   **Loading Skeletons**: Use generic skeleton loaders for KPI cards, tables, and charts during server-side data fetching.
*   **Performance Optimizations**:
    *   Use `next/dynamic()` for heavy client components (e.g., `Recharts`).
    *   Apply `React.memo` for components with expensive renders and stable props.
    *   Implement image optimization if any images are introduced in reports.

## Cache & Revalidation

*   **Reports Cache**: Cache heavily (e.g., 5-15 minutes or daily) using Next.js `revalidate` option. Invalidate (`revalidatePath('/reports')`) manually only if a major historical correction occurs.
*   **Orders Cache**: Cache lightly or use dynamic rendering (`force-dynamic`). Invalidate (`revalidatePath('/orders')`) immediately after `voidOrderAction` or when a new order is completed.

## Required Dependencies

*   `recharts`
*   `date-fns`
*   `sonner`
*   `@radix-ui/react-dialog`
*   `@radix-ui/react-select`
