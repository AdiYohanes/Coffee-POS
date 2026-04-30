"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getActiveOrdersAction } from "@/lib/actions/pos";
import { finishOrderAction } from "@/actions/orders";
import { getSessionAction } from "@/actions/auth";
import { formatCurrency } from "@/lib/utils";
import { Loader2, CheckCircle, Clock, Coffee, ChevronRight } from "lucide-react";
import { toast } from "sonner";
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
    orderModifiers: {
      modifier: { name: string };
    }[];
  }[];
};

export function OrderQueue() {
  const queryClient = useQueryClient();

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const res = await getSessionAction();
      return res.success ? res.data : null;
    },
  });

  const { data: orders, isLoading } = useQuery({
    queryKey: ["activeOrders"],
    queryFn: async () => {
      const res = await getActiveOrdersAction();
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    refetchInterval: 5000,
  });

  const playSuccessSound = () => {
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.2);
    } catch (e) {
      console.warn("Audio context not supported or blocked");
    }
  };

  const finishMutation = useMutation({
    mutationFn: (orderId: string) => finishOrderAction(orderId),
    onMutate: async (orderId) => {
      await queryClient.cancelQueries({ queryKey: ["activeOrders"] });
      const previousOrders = queryClient.getQueryData(["activeOrders"]);
      queryClient.setQueryData(["activeOrders"], (old: any) => 
        old ? old.filter((o: any) => o.id !== orderId) : []
      );
      return { previousOrders };
    },
    onError: (err, orderId, context) => {
      queryClient.setQueryData(["activeOrders"], context?.previousOrders);
      toast.error("Failed to finish order");
    },
    onSuccess: () => {
      playSuccessSound();
      toast.success("Order Finished!");
      queryClient.invalidateQueries({ queryKey: ["activeOrders"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });

  const isBarista = session?.user?.role === "barista" || session?.user?.role === "admin";

  if (isLoading) {
    return (
      <div className="flex h-full flex-col bg-surface border-r border-border">
        <div className="p-4 border-b border-border animate-pulse bg-white">
           <div className="h-5 w-24 bg-gray-200 rounded" />
        </div>
        <div className="flex-1 p-3 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-border animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const activeOrders = orders || [];

  return (
    <div className="flex h-full flex-col bg-surface border-r border-border">
      <div className="flex items-center justify-between p-4 border-b border-border bg-white">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-secondary" />
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Queue</h2>
        </div>
        <span className="text-[10px] font-black px-2 py-0.5 bg-secondary/10 text-secondary rounded-full border border-secondary/20">
          {activeOrders.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-hide">
        {activeOrders.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-muted space-y-2 py-10 opacity-60">
            <Coffee className="h-8 w-8" />
            <p className="text-[10px] font-bold uppercase tracking-widest">No pending orders</p>
          </div>
        ) : (
          activeOrders.map((order: ActiveOrder) => (
            <div key={order.id} className="bg-white rounded-2xl border border-border overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="p-3 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-secondary uppercase">#{order.id.slice(-4)}</span>
                    <span className="text-xs font-bold text-foreground truncate max-w-[100px]">{order.user.name}</span>
                  </div>
                  {isBarista && (
                    <button 
                      onClick={() => finishMutation.mutate(order.id)}
                      disabled={finishMutation.isPending}
                      className="flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                      {finishMutation.isPending ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5" />
                          <span>Mark Done</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  {order.orderItems.map((oi: ActiveOrder["orderItems"][0]) => (
                    <div key={oi.id} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-primary">{oi.quantity}x</span>
                          <span className="text-muted font-medium truncate max-w-[120px]">{oi.item.name}</span>
                        </div>
                        <ChevronRight className="h-2 w-2 text-gray-300" />
                      </div>
                      {oi.orderModifiers.length > 0 && (
                        <div className="flex flex-wrap gap-1 pl-4">
                          {oi.orderModifiers.map((om, idx) => (
                            <span key={idx} className="text-[9px] font-black text-secondary uppercase bg-secondary/5 px-1 rounded">
                              {om.modifier.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-surface px-3 py-2 flex justify-between items-center border-t border-border">
                <span className="text-[9px] font-bold text-muted uppercase">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="text-xs font-black text-secondary">{formatCurrency(parseFloat(order.total))}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
