"use client";

import { useQuery } from "@tanstack/react-query";
import { getMenuAction } from "@/lib/actions/pos";
import { useCartStore } from "@/lib/stores/cart";
import { useEffect, useState } from "react";
import { Coffee, Loader2, Plus } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { ModifierSelectionModal } from "./ModifierSelectionModal";

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
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isModifierModalOpen, setIsModifierModalOpen] = useState(false);
  const { add } = useCartStore();

  const { data: menu, isLoading } = useQuery({
    queryKey: ["menu"],
    queryFn: async () => {
      const res = await getMenuAction();
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    staleTime: 60 * 60 * 1000,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "1" && e.key <= "9") {
        const index = parseInt(e.key) - 1;
        const categories = menu || [];
        const currentCategory = activeCategory 
          ? categories.find((c: MenuCategory) => c.id === activeCategory) 
          : categories[0];
        
        if (currentCategory?.items[index]) {
          const item = currentCategory.items[index];
          handleItemClick(item);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menu, activeCategory]);

  const handleItemClick = (item: any) => {
    if (item.modifiers && item.modifiers.length > 0) {
      setSelectedItem(item);
      setIsModifierModalOpen(true);
    } else {
      add({
        id: item.id,
        name: item.name,
        price: parseFloat(item.basePrice),
        quantity: 1,
        modifiers: []
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full flex-col space-y-4">
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-10 w-24 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="aspect-[4/5] bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
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
              "whitespace-nowrap rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-200",
              (activeCategory === cat.id || (!activeCategory && categories[0]?.id === cat.id))
                ? "bg-primary text-white shadow-sm"
                : "bg-surface text-muted hover:bg-gray-100"
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
            onClick={() => handleItemClick(item)}
            className="group relative flex flex-col space-y-3 rounded-xl bg-white p-3 text-left border border-border shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/30 active:scale-[0.98]"
          >
            <div className="aspect-square w-full overflow-hidden rounded-md bg-surface flex items-center justify-center relative">
               {item.imageUrl ? (
                 <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
               ) : (
                 <Coffee className="h-8 w-8 text-gray-300" />
               )}
               <div className="absolute top-2 left-2 bg-primary/10 rounded-lg px-2 py-0.5 text-[10px] font-black text-primary border border-primary/20">
                 #{index + 1}
               </div>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-foreground line-clamp-1 text-sm">{item.name}</span>
              <span className="text-sm font-bold text-secondary mt-0.5">{formatCurrency(parseFloat(item.basePrice))}</span>
            </div>
            <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0 h-7 w-7 flex items-center justify-center rounded-full bg-primary text-white shadow-sm">
              <Plus className="h-4 w-4" />
            </div>
          </button>
        ))}

        {(!currentCategory || currentCategory.items.length === 0) && (
          <div className="col-span-full py-20 text-center text-muted">
            <Coffee className="mx-auto h-12 w-12 mb-4 opacity-20" />
            <p>No items found in this category.</p>
          </div>
        )}
      </div>

      <ModifierSelectionModal
        isOpen={isModifierModalOpen}
        onClose={() => {
          setIsModifierModalOpen(false);
          setSelectedItem(null);
        }}
        onConfirm={(selectedModifiers) => {
          if (selectedItem) {
            add({
              id: selectedItem.id,
              name: selectedItem.name,
              price: parseFloat(selectedItem.basePrice),
              quantity: 1,
              modifiers: selectedModifiers,
            });
          }
        }}
        item={selectedItem}
      />
    </div>
  );
}
