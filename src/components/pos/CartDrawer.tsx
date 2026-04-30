/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCartStore } from "@/lib/stores/cart";
import { formatCurrency } from "@/lib/utils";
import { Trash2, Plus, Minus, ShoppingCart, CreditCard } from "lucide-react";
import { useState, useEffect } from "react";
import { CheckoutModal } from "./CheckoutModal";

export function CartDrawer() {
  const {
    items,
    heldOrders,
    remove,
    updateQuantity,
    clear,
    hold,
    restore,
    getTotals,
  } = useCartStore();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { subtotal, tax, total } = isMounted
    ? getTotals()
    : { subtotal: 0, tax: 0, total: 0 };
  const heldRefs = isMounted ? Object.keys(heldOrders) : [];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2" && items.length > 0) {
        setIsCheckoutOpen(true);
      }
      if (e.key === "Escape" && !isCheckoutOpen) {
        clear();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [items.length, isCheckoutOpen, clear]);

  return (
    <div className="flex h-full flex-col bg-white border-l border-border shadow-2xl">
      <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <ShoppingCart className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Cart</h2>
        </div>
        <div className="flex items-center space-x-3">
          {isMounted && heldRefs.length > 0 && (
            <select
              onChange={(e) => restore(e.target.value)}
              className="bg-transparent text-[10px] font-bold text-secondary uppercase tracking-widest outline-none cursor-pointer border-none"
              value=""
            >
              <option value="" disabled>Held ({heldRefs.length})</option>
              {heldRefs.map((ref) => (
                <option key={ref} value={ref}>{ref}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => {
              const ref = prompt("Order reference:");
              if (ref) hold(ref);
            }}
            className="text-xs font-semibold text-secondary hover:text-amber-700 transition-colors uppercase tracking-wider"
          >
            Hold
          </button>
          <button
            onClick={clear}
            className="text-xs font-semibold text-muted hover:text-red-500 transition-colors uppercase tracking-wider"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {!isMounted || items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-muted space-y-3 opacity-40">
            <ShoppingCart className="h-12 w-12" />
            <p className="text-sm font-medium">Cart is empty</p>
          </div>
        ) : (
            <div
              key={item.cartItemId}
              className="flex flex-col space-y-2 group bg-surface p-2.5 rounded-xl border border-border transition-all hover:shadow-sm hover:border-primary/20"
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col flex-1">
                  <span className="font-semibold text-foreground text-sm">
                    {item.name}
                  </span>
                  <span className="text-xs text-secondary font-bold">
                    {formatCurrency(item.price)}
                  </span>
                  {item.modifiers.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.modifiers.map((m) => (
                        <span key={m.id} className="text-[10px] bg-secondary/10 text-secondary px-1.5 py-0.5 rounded-md font-bold">
                          +{m.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => remove(item.cartItemId)}
                  className="h-7 w-7 flex items-center justify-center rounded-lg text-muted hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 bg-white rounded-lg p-1 border border-border">
                  <button
                    onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                    className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-surface text-muted transition-colors"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="text-xs font-bold text-foreground min-w-[20px] text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                    className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-surface text-muted transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <span className="text-sm font-bold text-foreground">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 bg-surface border-t border-border space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted font-medium">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted font-medium">
            <span>Tax (10%)</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          <div className="flex justify-between text-xl font-black text-foreground pt-3 border-t border-border">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(total)}</span>
          </div>
        </div>

        <button
          disabled={!isMounted || items.length === 0}
          onClick={() => setIsCheckoutOpen(true)}
          className="w-full py-4 rounded-lg bg-primary text-white font-black uppercase tracking-widest text-sm shadow-sm hover:bg-amber-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center space-x-3"
        >
          <CreditCard className="h-5 w-5" />
          <span>Checkout (F2)</span>
        </button>
      </div>

      {isCheckoutOpen && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
        />
      )}
    </div>
  );
}
