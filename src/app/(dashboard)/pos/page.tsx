"use client";

import { MenuGrid } from "@/components/pos/MenuGrid";
import { CartDrawer } from "@/components/pos/CartDrawer";
import { OrderQueue } from "@/components/pos/OrderQueue";

export default function PosPage() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0B090A]">
      {/* Left: Order Queue */}
      <div className="w-64 flex-shrink-0 hidden xl:block">
        <OrderQueue />
      </div>

      {/* Center: Menu Grid */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          <header className="h-16 flex-shrink-0 border-b border-white/5 flex items-center justify-between px-6 bg-[#1C161A]/50">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center">
                <span className="text-[10px] font-black text-white">POS</span>
              </div>
              <h1 className="text-sm font-black text-white uppercase tracking-widest">
                Coffee <span className="text-purple-500">Terminal</span>
              </h1>
            </div>
            <div className="flex items-center space-x-4">
               <div className="flex flex-col items-end">
                 <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">System Status</span>
                 <span className="text-[11px] font-black text-green-500 uppercase tracking-widest flex items-center">
                   <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-2 animate-pulse" />
                   Online
                 </span>
               </div>
            </div>
          </header>
          <div className="flex-1 overflow-hidden p-6">
            <MenuGrid />
          </div>
        </div>
      </main>

      {/* Right: Cart Drawer */}
      <aside className="w-80 flex-shrink-0">
        <CartDrawer />
      </aside>
    </div>
  );
}
