"use client";

import { useQuery } from "@tanstack/react-query";
import { getMenuAction } from "@/lib/actions/pos";
import { useCartStore } from "@/lib/stores/cart";
import { useEffect, useState } from "react";
import { Coffee, Loader2 } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

type MenuCategory = {
  id: string;
  name: string;
  items: {
    id: string;
    name: string;
    basePrice: string;
    imageUrl: string | null;
  }[];
};

export function MenuGrid() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const { add } = useCartStore();

  const { data: menu, isLoading } = useQuery({
    queryKey: ["menu"],
    queryFn: async () => {
      const res = await getMenuAction();
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  // Handle keyboard shortcuts (1-9 for quick add)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "1" && e.key <= "9") {
        const index = parseInt(e.key) - 1;
        const currentCategory = activeCategory 
          ? menu?.find((c: MenuCategory) => c.id === activeCategory) 
          : menu?.[0];
        
        if (currentCategory?.items[index]) {
          const item = currentCategory.items[index];
          add({
            id: item.id,
            name: item.name,
            price: parseFloat(item.basePrice),
            quantity: 1,
            modifiers: []
          });
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menu, activeCategory, add]);

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const categories = menu || [];
  const currentCategory = activeCategory 
    ? categories.find((c: MenuCategory) => c.id === activeCategory) 
    : categories[0];

  return (
    <div className="flex h-full flex-col space-y-4">
      {/* Category Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat: MenuCategory) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200",
              (activeCategory === cat.id || (!activeCategory && categories[0]?.id === cat.id))
                ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30 translate-y-[-1px]"
                : "bg-[#1C161A] text-gray-400 hover:bg-[#2D242B] hover:text-gray-200"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-2 gap-4 overflow-y-auto pr-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 scrollbar-hide pb-20">
        {currentCategory?.items.map((item: MenuCategory["items"][0], index: number) => (
          <button
            key={item.id}
            onClick={() => add({
              id: item.id,
              name: item.name,
              price: parseFloat(item.basePrice),
              quantity: 1,
              modifiers: []
            })}
            className="group relative flex flex-col space-y-3 rounded-2xl bg-[#1C161A] p-4 text-left transition-all duration-200 hover:bg-[#251E23] hover:ring-2 hover:ring-purple-500/50 active:scale-95"
          >
            <div className="aspect-square w-full overflow-hidden rounded-xl bg-[#2D242B] flex items-center justify-center relative">
               {item.imageUrl ? (
                 <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
               ) : (
                 <Coffee className="h-10 w-10 text-gray-700" />
               )}
               <div className="absolute top-2 left-2 bg-black/40 backdrop-blur-md rounded-md px-1.5 py-0.5 text-[10px] font-bold text-gray-300 border border-white/10">
                 #{index + 1}
               </div>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-gray-100 line-clamp-1 text-sm">{item.name}</span>
              <span className="text-base font-bold text-green-400 mt-1">{formatCurrency(parseFloat(item.basePrice))}</span>
            </div>
            <div className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 h-8 w-8 flex items-center justify-center rounded-full bg-purple-500 text-white shadow-lg shadow-purple-500/40">
              <span className="text-xl">+</span>
            </div>
          </button>
        ))}

        {(!currentCategory || currentCategory.items.length === 0) && (
          <div className="col-span-full py-20 text-center text-gray-500">
            <Coffee className="mx-auto h-12 w-12 mb-4 opacity-20" />
            <p>No items found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
