- **Server Action Signatures**
  - `getMenuAction(): Promise<ActionResponse<MenuCategory[]>>`
  - `createOrderAction(payload: z.infer<typeof createOrderSchema>): Promise<ActionResponse<Order>>`
  - `getActiveOrdersAction(): Promise<ActionResponse<Order[]>>`
  - `updateOrderStatusAction(orderId: string, status: OrderStatus): Promise<ActionResponse<Order>>`

- **Zod Validation Schemas**
  - `createOrderSchema`:
    - `items`: `z.array(z.object({ id: z.string(), quantity: z.number().min(1), modifiers: z.array(z.string()).optional(), price: z.number(), name: z.string() })).min(1, "Cart cannot be empty")`
    - `totalAmount`: `z.number().positive("Total must be positive")`
  - `updateOrderStatusSchema`:
    - `orderId`: `z.string().uuid("Invalid order ID")`
    - `status`: `z.enum(["pending", "preparing", "ready", "completed", "cancelled"])`

- **Response Envelope**
  - `success`: `boolean`
  - `data` (optional): `T`
  - `error` (optional): `string`

- **Zustand Store Structure (`usePosStore`)**
  - **State**:
    - `items`: `CartItem[]`
    - `modifiers`: `Record<string, Modifier[]>`
    - `totals`: `{ subtotal: number, tax: number, total: number }`
  - **Actions**:
    - `add(item: CartItem)`
    - `remove(itemId: string)`
    - `clear()`
    - `hold(orderRef: string)`
    - `restore(orderRef: string)`
  - **Persistence**:
    - `localStorage` using Zustand's `persist` middleware

- **Component Tree (`/pos`)**
  - `PosLayout`
    - `CategoryTabs`
    - `MenuGrid`
      - `MenuItemCard`
    - `CartDrawer`
      - `CartItemList`
      - `CartTotals`
      - `CheckoutModal`
    - `OrderQueuePanel`
      - `ActiveOrderItem`

- **Cache Invalidation Strategy**
  - **Menu/Catalog**: Use TanStack Query with high `staleTime` (e.g., 1 hour).
  - **Orders**: Use `revalidatePath('/pos')` in Next.js Server Actions after `createOrderAction` and `updateOrderStatusAction` to immediately refresh the server-rendered queue.
  - **TanStack Query (Active Orders)**: Call `queryClient.invalidateQueries({ queryKey: ['activeOrders'] })` after state mutations.

- **Optimistic Update Rules**
  - **Cart**: Instant UI updates via Zustand synchronous state changes.
  - **Order Creation**: Add the new order to the local `activeOrders` array with a "pending" status and temporary ID before the `createOrderAction` resolves. Rollback and show toast error if the server action fails.
  - **Status Update**: Immediately transition the order card in `OrderQueuePanel` to the target status. Rollback if `updateOrderStatusAction` throws an error.

- **Mock Checkout Flow (v1)**
  - Simulate delay: `await new Promise(resolve => setTimeout(resolve, 1500))`
  - Success/Fail toggle: 90% success rate (`Math.random() > 0.1`)
  - Return mock receipt JSON:
    - `receiptId`: `MOCK-12345`
    - `timestamp`: Current ISO string
    - `items`: Matches payload
    - `total`: Matches payload
    - `paymentMethod`: `"cash"`

- **Route & Role Protection**
  - Path: `/pos`
  - Accessible By: `cashier`
  - Enforcement: Checked via `getSessionAction()` in `layout.tsx` or `page.tsx`. Redirects to `/dashboard` if unauthorized.

- **Required Dependencies**
  - `zustand`
  - `@tanstack/react-query`
  - `sonner`
  - `lucide-react`
  - `clsx`
  - `tailwind-merge`

- **Keyboard Shortcuts**
  | Shortcut | Action |
  | :--- | :--- |
  | `F2` | Open Checkout Modal |
  | `Esc` | Clear Cart / Close Modal |
  | `1-9` | Quick Add Item (mapped to grid indices) |
