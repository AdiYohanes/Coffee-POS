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
  History
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
          <h1 className="text-3xl font-bold flex items-center gap-3 text-white">
            <History className="text-violet-500" />
            Order History
          </h1>
          <p className="text-gray-400 mt-1">Review, void, and print past transactions.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-violet-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Search by ID or Cashier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-[#1C161A] border border-white/5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 w-full md:w-64 transition-all"
              aria-label="Search Orders"
            />
          </div>
          <button className="p-2 bg-[#1C161A] border border-white/5 rounded-xl hover:bg-white/5 transition-colors" aria-label="Filter Orders">
            <Filter className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </header>

      <ErrorBoundary>
        <div className="bg-[#1C161A] border border-white/5 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/2">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Cashier</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <TableSkeleton />
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 italic">No orders found matching your criteria.</td>
                  </tr>
                ) : (
                  filteredOrders.map((order: any) => (
                    <tr 
                      key={order.id} 
                      onClick={() => setSelectedOrder(order)}
                      className={`hover:bg-white/2 transition-colors cursor-pointer ${selectedOrder?.id === order.id ? 'bg-violet-500/10' : ''}`}
                      tabIndex={0}
                      role="row"
                      aria-selected={selectedOrder?.id === order.id}
                      onKeyDown={(e) => e.key === 'Enter' && setSelectedOrder(order)}
                    >
                      <td className="px-6 py-4 font-mono text-sm text-violet-400">#{order.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {format(new Date(order.createdAt), "MMM dd, HH:mm")}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">{order.user.name}</td>
                      <td className="px-6 py-4 text-sm font-bold text-white">${Number(order.total).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); setIsPreviewOpen(true); }}
                            className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white"
                            title="Print Receipt (P)"
                            aria-label={`Print receipt for order ${order.id}`}
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          {order.status !== "VOID" && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); setIsVoidModalOpen(true); }}
                              className="p-1.5 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1C161A] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-2 text-white">Void Order #{selectedOrder?.id}</h2>
            <p className="text-sm text-gray-400 mb-6">Are you sure you want to void this order? This action cannot be undone and will be logged for audit.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Reason for Voiding</label>
                <textarea 
                  className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-500/50 focus:outline-none transition-all resize-none"
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
                  className="flex-1 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => voidMutation.mutate({ orderId: selectedOrder.id, reason: voidReason })}
                  disabled={voidReason.length < 5 || voidMutation.isPending}
                  className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors text-sm font-bold flex items-center justify-center gap-2"
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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3" /> Done
        </span>
      );
    case "VOID":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
          <XCircle className="w-3 h-3" /> Voided
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
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
              <div className="h-4 bg-white/5 rounded w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
