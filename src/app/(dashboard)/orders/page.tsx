"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Ban, 
  Printer, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Clock,
  History,
  RefreshCcw
} from "lucide-react";
import { getOrderHistoryAction, voidOrderAction } from "@/lib/actions/reports";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

const ReceiptPreview = dynamic(() => import("@/components/reports/ReceiptPreview"), { ssr: false });

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders", "history"],
    queryFn: () => getOrderHistoryAction(),
  });

  const voidMutation = useMutation({
    mutationFn: (data: { orderId: string; reason: string }) => voidOrderAction(data),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Order voided successfully");
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        queryClient.invalidateQueries({ queryKey: ["reports"] });
        setIsVoidModalOpen(false);
        setVoidReason("");
      } else {
        toast.error(res.error);
      }
    },
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "v" && selectedOrder && selectedOrder.status !== "VOID") {
        setIsVoidModalOpen(true);
      }
      if (e.key.toLowerCase() === "p" && selectedOrder) {
        setIsPreviewOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedOrder]);

  const filteredOrders = orders?.success 
    ? orders.data.filter((o: any) => 
        o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        o.user.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) 
    : [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3 text-foreground">
            <History className="text-secondary" />
            Order History
          </h1>
          <p className="text-muted mt-1 font-medium">Review, void, and print past transactions.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-secondary transition-colors" />
            <input 
              type="text" 
              placeholder="Search by ID or Cashier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50 w-full md:w-64 transition-all"
              aria-label="Search Orders"
            />
          </div>
          <button className="p-2 bg-white border border-border rounded-xl hover:bg-surface transition-colors" aria-label="Filter Orders">
            <Filter className="w-5 h-5 text-muted" />
          </button>
        </div>
      </header>

      <ErrorBoundary>
        <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest">Order ID</th>
                  <th className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest">Date & Time</th>
                  <th className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest">Cashier</th>
                  <th className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest">Total</th>
                  <th className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <TableSkeleton />
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted italic">No orders found matching your criteria.</td>
                  </tr>
                ) : (
                  filteredOrders.map((order: any) => (
                    <tr 
                      key={order.id} 
                      onClick={() => setSelectedOrder(order)}
                      className={`hover:bg-surface/50 transition-colors cursor-pointer ${selectedOrder?.id === order.id ? 'bg-secondary/5' : ''}`}
                      tabIndex={0}
                      role="row"
                      aria-selected={selectedOrder?.id === order.id}
                      onKeyDown={(e) => e.key === 'Enter' && setSelectedOrder(order)}
                    >
                      <td className="px-6 py-4 font-mono text-sm text-secondary font-bold">#{order.id.slice(-6)}</td>
                      <td className="px-6 py-4 text-sm text-foreground font-medium">
                        {format(new Date(order.createdAt), "MMM dd, HH:mm")}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted font-medium">{order.user.name}</td>
                      <td className="px-6 py-4 text-sm font-black text-foreground">${Number(order.total).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); setIsPreviewOpen(true); }}
                            className="p-2 hover:bg-surface rounded-lg text-muted hover:text-primary transition-colors"
                            title="Print Receipt (P)"
                            aria-label={`Print receipt for order ${order.id}`}
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          {order.status !== "VOID" && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); setIsVoidModalOpen(true); }}
                              className="p-2 hover:bg-red-50 rounded-lg text-muted hover:text-red-600 transition-colors"
                              title="Void Order (V)"
                              aria-label={`Void order ${order.id}`}
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </ErrorBoundary>

      {/* Void Modal */}
      {isVoidModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black mb-2 text-foreground">Void Order #{selectedOrder?.id.slice(-6)}</h2>
            <p className="text-sm text-muted mb-6 font-medium">Are you sure you want to void this order? This action cannot be undone and will be logged for audit.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2">Reason for Voiding</label>
                <textarea 
                  className="w-full bg-surface border border-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-500/50 focus:outline-none transition-all resize-none font-medium"
                  rows={3}
                  placeholder="e.g., Customer changed mind, Entry error..."
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  aria-label="Void Reason"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setIsVoidModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-surface hover:bg-gray-100 transition-colors text-sm font-bold text-muted"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => voidMutation.mutate({ orderId: selectedOrder.id, reason: voidReason })}
                  disabled={voidReason.length < 5 || voidMutation.isPending}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-all text-sm font-black text-white flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                >
                  {voidMutation.isPending && <RefreshCcw className="w-4 h-4 animate-spin" />}
                  Confirm Void
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Preview Modal */}
      {isPreviewOpen && selectedOrder && (
        <ReceiptPreview 
          order={selectedOrder} 
          onClose={() => setIsPreviewOpen(false)} 
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "DONE":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-green-50 text-green-600 border border-green-200">
          <CheckCircle2 className="w-3 h-3" /> Done
        </span>
      );
    case "VOID":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-600 border border-red-200">
          <XCircle className="w-3 h-3" /> Voided
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-secondary border border-amber-200">
          <Clock className="w-3 h-3" /> Pending
        </span>
      );
  }
}

function TableSkeleton() {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <tr key={i} className="animate-pulse">
          {[...Array(6)].map((_, j) => (
            <td key={j} className="px-6 py-4">
              <div className="h-4 bg-surface rounded w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
