"use client";

import { useQuery } from "@tanstack/react-query";
import { getActiveOrdersAction, updateOrderStatusAction } from "@/lib/actions/pos";
import { formatCurrency } from "@/lib/utils";
import { Loader2, CheckCircle, Clock, Coffee, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

type ActiveOrder = {
  id: string;
  createdAt: string | Date;
  total: string;
  user: { name: string };
  orderItems: {
    id: string;
    quantity: number;
    item: { name: string };
  }[];
};

export function OrderQueue() {
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["activeOrders"],
    queryFn: async () => {
      const res = await getActiveOrdersAction();
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    refetchInterval: 5000,
  });

  async function handleComplete(orderId: string) {
    try {
      const res = await updateOrderStatusAction({ orderId, status: "DONE" });
      if (res.success) {
        toast.success("Order Completed");
        queryClient.invalidateQueries({ queryKey: ["activeOrders"] });
      } else {
        toast.error(res.error || "Failed to update order");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
      </div>
    );
  }

  const activeOrders = orders || [];

  return (
    <div className="flex h-full flex-col bg-[#0B090A] border-r border-white/5">
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#1C161A]/30">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-purple-500" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Queue</h2>
        </div>
        <span className="text-[10px] font-black px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full border border-purple-500/20">
          {activeOrders.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-hide">
        {activeOrders.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-gray-700 space-y-2 py-10 opacity-40">
            <Coffee className="h-8 w-8" />
            <p className="text-[10px] font-bold uppercase tracking-widest">No pending orders</p>
          </div>
        ) : (
          activeOrders.map((order: ActiveOrder) => (
            <div key={order.id} className="group bg-[#1C161A] rounded-xl overflow-hidden border border-white/5 transition-all hover:border-purple-500/30">
              <div className="p-3 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-purple-500 uppercase">#{order.id.slice(-4)}</span>
                    <span className="text-xs font-bold text-white truncate max-w-[100px]">{order.user.name}</span>
                  </div>
                  <button 
                    onClick={() => handleComplete(order.id)}
                    className="h-8 w-8 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center hover:bg-green-500 hover:text-white transition-all shadow-lg shadow-green-500/0 hover:shadow-green-500/20"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  {order.orderItems.map((oi: ActiveOrder["orderItems"][0]) => (
                    <div key={oi.id} className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-purple-400">{oi.quantity}x</span>
                        <span className="text-gray-300 font-medium truncate max-w-[120px]">{oi.item.name}</span>
                      </div>
                      <ChevronRight className="h-2 w-2 text-gray-700" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-black/40 px-3 py-2 flex justify-between items-center border-t border-white/5">
                <span className="text-[9px] font-bold text-gray-500 uppercase">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="text-xs font-black text-green-400">{formatCurrency(parseFloat(order.total))}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
