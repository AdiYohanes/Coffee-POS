import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";

export interface CartItem {
  cartItemId: string;
  id: string; // Database ID of the item
  name: string;
  price: number;
  quantity: number;
  modifiers: { id: string; name: string; price: number }[]; // Array of modifier objects
}

interface PosState {
  items: CartItem[];
  heldOrders: Record<string, CartItem[]>;
  add: (item: Omit<CartItem, "cartItemId">) => void;
  remove: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clear: () => void;
  hold: (orderRef: string) => void;
  restore: (orderRef: string) => void;
  getTotals: () => { subtotal: number; tax: number; total: number };
}

export const useCartStore = create<PosState>()(
  persist(
    (set, get) => ({
      items: [],
      heldOrders: {},
      add: (item) => {
        set((state) => {
          // Check if item with same ID and same modifiers already exists
          const existingItemIndex = state.items.findIndex(
            (i) => i.id === item.id && JSON.stringify(i.modifiers) === JSON.stringify(item.modifiers)
          );

          if (existingItemIndex > -1) {
            const newItems = [...state.items];
            newItems[existingItemIndex].quantity += item.quantity;
            return { items: newItems };
          }

          return { items: [...state.items, { ...item, cartItemId: nanoid() }] };
        });
      },
      remove: (cartItemId) => {
        set((state) => ({
          items: state.items.filter((i) => i.cartItemId !== cartItemId),
        }));
      },
      updateQuantity: (cartItemId, quantity) => {
        if (quantity <= 0) {
          get().remove(cartItemId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.cartItemId === cartItemId ? { ...i, quantity } : i
          ),
        }));
      },
      clear: () => set({ items: [] }),
      hold: (orderRef) => {
        const { items, heldOrders } = get();
        if (items.length === 0) return;
        set({
          heldOrders: { ...heldOrders, [orderRef]: items },
          items: [],
        });
      },
      restore: (orderRef) => {
        const { heldOrders } = get();
        const items = heldOrders[orderRef];
        if (!items) return;
        const newHeldOrders = { ...heldOrders };
        delete newHeldOrders[orderRef];
        set({ items, heldOrders: newHeldOrders });
      },
      getTotals: () => {
        const subtotal = get().items.reduce((acc, item) => {
          const modifiersTotal = item.modifiers.reduce(
            (sum, mod) => sum + mod.price,
            0
          );
          return acc + (item.price + modifiersTotal) * item.quantity;
        }, 0);
        const tax = subtotal * 0.1; // 10% VAT
        return {
          subtotal: Number(subtotal.toFixed(2)),
          tax: Number(tax.toFixed(2)),
          total: Number((subtotal + tax).toFixed(2)),
        };
      },
    }),
    {
      name: "coffee-pos-cart",
    }
  )
);
