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

  // Use a fallback for getTotals before hydration to avoid server/client mismatch
  const { subtotal, tax, total } = isMounted
    ? getTotals()
    : { subtotal: 0, tax: 0, total: 0 };
  const heldRefs = isMounted ? Object.keys(heldOrders) : [];

  // F2 keyboard shortcut for checkout
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
    <div className="flex h-full flex-col bg-[#1C161A] border-l border-white/5 shadow-2xl">
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <ShoppingCart className="h-4 w-4 text-purple-500" />
          </div>
          <h2 className="text-lg font-bold text-white">Current Order</h2>
        </div>
        <div className="flex items-center space-x-3">
          {isMounted && heldRefs.length > 0 && (
            <select
              onChange={(e) => restore(e.target.value)}
              className="bg-transparent text-[10px] font-bold text-purple-400 uppercase tracking-widest outline-none cursor-pointer border-none"
              value=""
            >
              <option value="" disabled className="bg-[#1C161A]">
                Held ({heldRefs.length})
              </option>
              {heldRefs.map((ref) => (
                <option key={ref} value={ref} className="bg-[#1C161A]">
                  {ref}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => {
              const ref = prompt("Enter order reference:");
              if (ref) hold(ref);
            }}
            className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors uppercase tracking-wider"
          >
            Hold
          </button>
          <button
            onClick={clear}
            className="text-xs font-semibold text-gray-500 hover:text-red-400 transition-colors uppercase tracking-wider"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {!isMounted || items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-gray-600 space-y-3 opacity-30">
            <ShoppingCart className="h-16 w-16" />
            <p className="text-sm font-medium">Cart is empty</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.cartItemId}
              className="flex flex-col space-y-2 group bg-[#251E23]/50 p-3 rounded-xl border border-transparent hover:border-white/5 transition-all"
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col flex-1">
                  <span className="font-semibold text-gray-100 text-sm">
                    {item.name}
                  </span>
                  <span className="text-xs text-purple-400 font-bold">
                    {formatCurrency(item.price)}
                  </span>
                </div>
                <button
                  onClick={() => remove(item.cartItemId)}
                  className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 bg-black/20 rounded-lg p-1 border border-white/5">
                  <button
                    onClick={() =>
                      updateQuantity(item.cartItemId, item.quantity - 1)
                    }
                    className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-white/5 text-gray-400 transition-colors"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="text-xs font-bold text-white min-w-[20px] text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      updateQuantity(item.cartItemId, item.quantity + 1)
                    }
                    className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-white/5 text-gray-400 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <span className="text-sm font-bold text-gray-200">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 bg-[#251E23] border-t border-white/5 space-y-4 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-500 font-medium">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500 font-medium">
            <span>Tax (10%)</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          <div className="flex justify-between text-xl font-black text-white pt-3 border-t border-white/10">
            <span>Total</span>
            <span className="text-green-400">{formatCurrency(total)}</span>
          </div>
        </div>

        <button
          disabled={!isMounted || items.length === 0}
          onClick={() => setIsCheckoutOpen(true)}
          className="group relative w-full overflow-hidden py-4 rounded-xl bg-purple-600 text-white font-black uppercase tracking-widest text-sm shadow-xl shadow-purple-500/20 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
        >
          <div className="relative z-10 flex items-center justify-center space-x-3">
            <CreditCard className="h-5 w-5" />
            <span>Process Checkout (F2)</span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
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
