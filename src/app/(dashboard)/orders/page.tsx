"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  Search, 
  Filter, 
  Trash2, 
  Printer, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  MoreVertical,
  X
} from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { getOrderHistoryAction, voidOrderAction, getReceiptDataAction } from "@/lib/actions/reports";

// Radix UI Imports
import * as Dialog from "@radix-ui/react-dialog";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

// Dynamic imports for heavy components
const ReceiptPreview = dynamic(() => import("@/components/reports/ReceiptPreview"), {
  loading: () => <div className="h-96 w-full animate-pulse bg-white/5 rounded-lg" />,
});

/**
 * Orders Management Page
 */
export default function OrdersPage() {
  return (
    <ErrorBoundary>
      <OrdersContent />
    </ErrorBoundary>
  );
}

function OrdersContent() {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [filterStatus, setFilterStatus] = useState<any>(undefined);

  // Fetch Order History
  const { data: orders, isLoading } = useQuery({
    queryKey: ["orderHistory", filterStatus],
    queryFn: async () => {
      const res = await getOrderHistoryAction({ status: filterStatus });
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
  });

  // Void Mutation
  const voidMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => voidOrderAction(id, reason),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Order voided successfully");
        queryClient.invalidateQueries({ queryKey: ["orderHistory"] });
        setIsVoidModalOpen(false);
        setVoidReason("");
        setSelectedOrderId(null);
      } else {
        toast.error(res.error || "Failed to void order");
      }
    },
  });

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key.toLowerCase() === "v" && selectedOrderId) {
        setIsVoidModalOpen(true);
      }
      if (e.key.toLowerCase() === "p" && selectedOrderId) {
        setIsReceiptModalOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedOrderId]);

  const handleVoidConfirm = () => {
    if (!selectedOrderId || voidReason.length < 5) return;
    voidMutation.mutate({ id: selectedOrderId, reason: voidReason });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <header className="flex justify-between items-end border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Order History</h1>
          <p className="text-white/50 text-sm mt-1">Monitor and manage past transactions</p>
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <select
              className="bg-[#1C161A] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-[#8B5CF6] focus:outline-none appearance-none cursor-pointer"
              value={filterStatus || ""}
              onChange={(e) => setFilterStatus(e.target.value || undefined)}
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              <option value="DONE">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="VOID">Voided</option>
            </select>
          </div>
        </div>
      </header>

      {/* Orders Table */}
      <div className="bg-[#1C161A] rounded-xl border border-white/10 overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse" role="grid" aria-label="Order history table">
          <thead>
            <tr className="bg-white/5 text-xs font-semibold uppercase tracking-wider text-white/40">
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Date & Time</th>
              <th className="px-6 py-4">Customer/User</th>
              <th className="px-6 py-4">Items</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={7} className="px-6 py-4 h-16 bg-white/5" />
                </tr>
              ))
            ) : orders?.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-white/30 italic">
                  No orders found matching the criteria.
                </td>
              </tr>
            ) : (
              orders?.map((order: any) => (
                <tr 
                  key={order.id} 
                  className={`group transition-colors cursor-pointer ${selectedOrderId === order.id ? 'bg-[#8B5CF6]/10' : 'hover:bg-white/5'}`}
                  onClick={() => setSelectedOrderId(order.id)}
                  tabIndex={0}
                  role="row"
                  aria-selected={selectedOrderId === order.id}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedOrderId(order.id)}
                >
                  <td className="px-6 py-4 font-mono text-xs text-white/60">{order.id}</td>
                  <td className="px-6 py-4 text-sm">
                    {format(new Date(order.createdAt), "MMM dd, HH:mm")}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{order.user?.name}</td>
                  <td className="px-6 py-4 text-sm text-white/50">
                    {order.orderItems?.length} items
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-[#8B5CF6]">
                    ${parseFloat(order.total).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                        order.status === 'DONE' ? 'bg-green-500/10 text-green-400' :
                        order.status === 'VOID' ? 'bg-red-500/10 text-red-400' :
                        'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {order.status === 'DONE' && <CheckCircle2 className="w-3 h-3" />}
                        {order.status === 'PENDING' && <Clock className="w-3 h-3" />}
                        {order.status === 'VOID' && <AlertCircle className="w-3 h-3" />}
                        {order.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedOrderId(order.id); setIsReceiptModalOpen(true); }}
                        className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white"
                        title="Print Receipt (P)"
                        aria-label={`Print receipt for order ${order.id}`}
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      {order.status !== 'VOID' && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedOrderId(order.id); setIsVoidModalOpen(true); }}
                          className="p-2 hover:bg-red-500/10 rounded-lg text-red-400/60 hover:text-red-400"
                          title="Void Order (V)"
                          aria-label={`Void order ${order.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Void Modal */}
      <Dialog.Root open={isVoidModalOpen} onOpenChange={setIsVoidModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#1C161A] border border-white/10 rounded-2xl p-6 shadow-2xl z-50 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <Dialog.Title className="text-xl font-bold flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-500" />
                Void Order
              </Dialog.Title>
              <Dialog.Close className="text-white/40 hover:text-white" aria-label="Close modal">
                <X className="w-5 h-5" />
              </Dialog.Close>
            </div>

            <p className="text-sm text-white/50 mb-6">
              Are you sure you want to void order <span className="text-white font-mono">{selectedOrderId}</span>? This action cannot be undone.
            </p>

            <div className="space-y-4">
              <label htmlFor="void-reason" className="block text-xs font-semibold uppercase text-white/40 tracking-wider">
                Reason for Voiding (required)
              </label>
              <textarea
                id="void-reason"
                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none min-h-[100px] resize-none"
                placeholder="e.g., Wrong item selected, Customer changed mind..."
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                aria-required="true"
              />
            </div>

            <div className="mt-8 flex gap-3">
              <Dialog.Close className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-semibold transition-colors">
                Cancel
              </Dialog.Close>
              <button
                disabled={voidReason.length < 5 || voidMutation.isPending}
                onClick={handleVoidConfirm}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition-colors"
                aria-label="Confirm void order"
              >
                {voidMutation.isPending ? "Voiding..." : "Confirm Void"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Receipt Preview Modal */}
      <Dialog.Root open={isReceiptModalOpen} onOpenChange={setIsReceiptModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl z-50">
            <div className="absolute top-4 right-4 no-print">
              <Dialog.Close className="p-1 bg-black/10 hover:bg-black/20 rounded-full text-black/60" aria-label="Close receipt">
                <X className="w-5 h-5" />
              </Dialog.Close>
            </div>
            
            <div className="overflow-y-auto max-h-[80vh]">
              {selectedOrderId && (
                <ReceiptLoader orderId={selectedOrderId} />
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3 no-print">
              <button 
                onClick={handlePrint}
                className="flex-1 py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                aria-label="Print receipt"
              >
                <Printer className="w-4 h-4" />
                Print (P)
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

/**
 * Helper to load receipt data
 */
function ReceiptLoader({ orderId }: { orderId: string }) {
  const { data: res, isLoading } = useQuery({
    queryKey: ["receipt", orderId],
    queryFn: () => getReceiptDataAction(orderId),
    enabled: !!orderId,
  });

  if (isLoading) {
    return <div className="h-96 w-full flex items-center justify-center text-black/20">Loading...</div>;
  }

  if (!res?.success) {
    return <div className="p-8 text-center text-red-500">Failed to load receipt</div>;
  }

  return <ReceiptPreview data={res.data} />;
}
