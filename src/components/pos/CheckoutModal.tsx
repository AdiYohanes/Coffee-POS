"use client";

import { useCartStore } from "@/lib/stores/cart";
import { createOrderAction } from "@/lib/actions/pos";
import { formatCurrency } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, XCircle, Receipt, X } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const { items, getTotals, clear } = useCartStore();
  const { subtotal, tax, total } = getTotals();
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [receipt, setReceipt] = useState<any>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  async function handleCheckout() {
    setStatus("processing");
    
    // Simulate payment delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // 90% success rate
    if (Math.random() <= 0.1) {
      setStatus("error");
      toast.error("Payment Failed", {
        description: "Transaction rejected by processor.",
      });
      return;
    }

    try {
      const res = await createOrderAction({
        items: items.map(i => ({
          id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          modifiers: i.modifiers
        })),
        subtotal,
        tax,
        totalAmount: total,
      });

      if (res.success) {
        setReceipt({
          receiptId: `RCP-${Math.random().toString(36).substring(7).toUpperCase()}`,
          total,
          items: [...items],
          timestamp: new Date().toISOString(),
        });
        setStatus("success");
        toast.success("Order Placed", {
          description: `Order #${res.data.orderId} created successfully.`,
        });
        clear();
        queryClient.invalidateQueries({ queryKey: ["activeOrders"] });
      } else {
        throw new Error(res.error);
      }
    } catch (error: any) {
      setStatus("error");
      toast.error("Order Failed", {
        description: error.message || "Failed to sync order with server.",
      });
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-[#1C161A] border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {status === "idle" && (
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-6">Complete Checkout</h2>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center text-gray-400">
                <span>Items Count</span>
                <span className="text-white font-medium">{items.length}</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold text-white pt-4 border-t border-white/5">
                <span>Total Amount</span>
                <span className="text-green-400 text-2xl">{formatCurrency(total)}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onClose}
                className="py-3 rounded-xl bg-white/5 text-gray-300 font-bold hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCheckout}
                className="py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-500 shadow-lg shadow-purple-500/20 transition-all active:scale-[0.98]"
              >
                Pay Now
              </button>
            </div>
          </div>
        )}

        {status === "processing" && (
          <div className="p-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
            <div className="text-center">
              <p className="text-lg font-bold text-white">Processing Payment</p>
              <p className="text-sm text-gray-500">Please wait while we authorize your transaction...</p>
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="p-6">
            <div className="flex flex-col items-center justify-center space-y-4 mb-8 pt-4">
              <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-white">Payment Successful</p>
                <p className="text-sm text-gray-500">Receipt generated: {receipt?.receiptId}</p>
              </div>
            </div>

            <div className="rounded-xl bg-black/40 p-4 border border-white/5 space-y-3 mb-6">
              <div className="flex items-center space-x-2 text-gray-400 text-xs uppercase tracking-widest font-bold">
                <Receipt className="h-3 w-3" />
                <span>Receipt Details</span>
              </div>
              <div className="space-y-2">
                {receipt?.items.map((item: any) => (
                  <div key={item.cartItemId} className="flex justify-between text-sm">
                    <span className="text-gray-300">{item.quantity}x {item.name}</span>
                    <span className="text-gray-400">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-white/10 flex justify-between font-bold text-white">
                  <span>Total Paid</span>
                  <span className="text-green-400">{formatCurrency(receipt?.total)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-500 transition-colors"
            >
              Done
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="p-12 flex flex-col items-center justify-center space-y-4">
            <XCircle className="h-16 w-16 text-red-500" />
            <div className="text-center">
              <p className="text-xl font-bold text-white">Payment Failed</p>
              <p className="text-sm text-gray-500">There was an error processing your transaction.</p>
            </div>
            <button
              onClick={() => setStatus("idle")}
              className="mt-4 px-8 py-2 rounded-lg bg-white/5 text-white font-medium hover:bg-white/10 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
