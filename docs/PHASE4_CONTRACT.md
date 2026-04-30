# Phase 4 Contract: Reporting, Void/Hold, Receipt & QA

## 1. Server Action Signatures

| Action | Parameters | Return Type | Description |
| :--- | :--- | :--- | :--- |
| `getDailySalesAction` | `start: Date, end: Date` | `Promise<ActionResponse<DailySalesData[]>>` | Fetches sales grouped by day. |
| `getTopItemsAction` | `limit: number` | `Promise<ActionResponse<TopItemData[]>>` | Fetches top selling items up to `limit`. |
| `voidOrderAction` | `orderId: string, reason: string` | `Promise<ActionResponse<Order>>` | Voids an order with a mandatory reason. |
| `getReceiptDataAction` | `orderId: string` | `Promise<ActionResponse<ReceiptData>>` | Retrieves formatted receipt data. |

## 2. Zod Validation Schemas

- **Date Range Filter**
  - `start`: `z.date({ required_error: "Start date is required" })`
  - `end`: `z.date({ required_error: "End date is required" })`
- **Top Items Filter**
  - `limit`: `z.number().int().min(1).max(50).default(10)`
- **Void Order Input**
  - `orderId`: `z.string().uuid("Invalid order ID format")`
  - `reason`: `z.string().min(5, "Void reason must be at least 5 characters").max(200)`
- **Receipt Input**
  - `orderId`: `z.string().uuid("Invalid order ID format")`

## 3. Data Aggregation Logic

- **Grouping**: Group daily sales by `DATE(created_at)` using SQL aggregation, categorized by item category.
- **Void Totals**: Exclude voided orders from revenue totals, but calculate a separate `voidTotal` to track losses.
- **Timezone Handling**: Ensure `created_at` (UTC) is converted to local timezone before grouping by day to prevent sales spilling into incorrect days.

## 4. Component Tree

- `/reports`
  - `DateFilterPanel`
  - `KPICards` (Revenue, Order Count, Void Losses)
  - `RechartsWrapper`
    - `DailySalesChart` (BarChart/LineChart)
    - `TopItemsChart` (PieChart/BarChart)
- `/orders`
  - `OrderHistoryTable`
    - `StatusBadge`
    - `ActionMenu`
  - `VoidOrderModal` (Contains reason text input)
  - `ReceiptPreviewDialog`

## 5. Role Permissions

- **`admin`**: Full access to `/reports` and all `/orders`.
- **`cashier`**: Restricted from `/reports`. Can view their own orders in `/orders` and can void their own orders (reason required).

## 6. Receipt Generation Strategy

- **Trigger**: Programmatic `window.print()` triggered via client component.
- **Layout**: 80mm thermal printer format.
- **Implementation**: HTML/CSS based using `@media print` rules.
- **UI Chrome**: Hide all navigation, sidebars, and buttons during print mode.

## 7. QA & Polish Checklist

- [ ] **Lighthouse Targets**: >80 on Performance, Accessibility, Best Practices, and SEO.
- [ ] **Accessibility (a11y)**: Proper `aria-labels`, focus management for modals, screen reader support for charts.
- [ ] **Error Boundaries**: Wrap `/reports` and `/orders` with global and component-level error boundaries.
- [ ] **Loading Skeletons**: Implement `Suspense` with skeleton fallbacks for chart and table fetching.
- [ ] **Dynamic Loading**: Use `next/dynamic` for heavy client components like `recharts` to reduce initial bundle size (`dynamic(() => import('recharts'), { ssr: false })`).

## 8. Cache & Revalidation

- **Reports**: Use `staleTime: 5 * 60 * 1000` (5 minutes) for report queries. Do not aggressively invalidate on every order to save DB load.
- **Orders Table**: Use `revalidatePath('/orders')` when `voidOrderAction` executes to immediately reflect status changes.
- **Receipt Data**: Cache indefinitely or use long `staleTime` since historical receipts do not change.

## 9. Required Dependencies

- `recharts`
- `date-fns`
- `sonner`
- `@radix-ui/react-dialog`
- `@radix-ui/react-dropdown-menu`
- `@radix-ui/react-slot`

## 10. Thermal Receipt Print CSS Rules

```css
@media print {
  /* Hide UI Chrome */
  nav, header, aside, button, .no-print {
    display: none !important;
  }

  /* Force background colors (if needed for logos) */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Thermal 80mm Layout Constraints */
  @page {
    margin: 0;
    size: 80mm 297mm; /* Standard 80mm roll width, arbitrary long height */
  }

  body {
    width: 80mm;
    margin: 0;
    padding: 5mm; /* Inner padding for the receipt text */
    font-family: 'Courier New', Courier, monospace; /* Thermal style font */
    font-size: 12px; /* Standard thermal font size */
    line-height: 1.2;
    background: white;
    color: black;
  }

  .receipt-container {
    width: 100%;
    /* Ensure content flows down naturally */
    display: block;
  }
}
```
