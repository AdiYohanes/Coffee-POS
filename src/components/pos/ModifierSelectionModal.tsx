"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Modifier {
  id: string;
  name: string;
  additionalPrice: string;
}

interface Item {
  id: string;
  name: string;
  basePrice: string;
  modifiers: Modifier[];
}

interface ModifierSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedModifiers: { id: string; name: string; price: number }[]) => void;
  item: Item | null;
}

export function ModifierSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  item,
}: ModifierSelectionModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  if (!isOpen || !item) return null;

  const toggleModifier = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);
  };

  const handleConfirm = () => {
    const selectedModifiers = item.modifiers
      .filter((m) => selected.has(m.id))
      .map((m) => ({
        id: m.id,
        name: m.name,
        price: parseFloat(m.additionalPrice),
      }));
    onConfirm(selectedModifiers);
    setSelected(new Set());
    onClose();
  };

  const basePrice = parseFloat(item.basePrice);
  const modifiersTotal = item.modifiers
    .filter((m) => selected.has(m.id))
    .reduce((sum, m) => sum + parseFloat(m.additionalPrice), 0);
  const totalPrice = basePrice + modifiersTotal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white border border-border shadow-2xl animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted hover:text-primary transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground">{item.name}</h2>
            <p className="text-sm text-muted">Customize your selection</p>
          </div>

          <div className="space-y-3 mb-8 max-h-[40vh] overflow-y-auto scrollbar-hide">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">Available Modifiers</p>
            {item.modifiers.map((mod) => (
              <button
                key={mod.id}
                onClick={() => toggleModifier(mod.id)}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 group",
                  selected.has(mod.id)
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border bg-white hover:border-secondary/50 hover:bg-surface"
                )}
              >
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "h-5 w-5 rounded-md border flex items-center justify-center transition-colors",
                    selected.has(mod.id) ? "bg-primary border-primary text-white" : "border-border bg-white"
                  )}>
                    {selected.has(mod.id) && <Check className="h-3 w-3" />}
                  </div>
                  <span className={cn(
                    "font-semibold text-sm transition-colors",
                    selected.has(mod.id) ? "text-primary" : "text-foreground"
                  )}>{mod.name}</span>
                </div>
                <span className="text-sm font-bold text-secondary">
                  +{formatCurrency(parseFloat(mod.additionalPrice))}
                </span>
              </button>
            ))}
          </div>

          <div className="pt-6 border-t border-border">
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm font-bold text-muted uppercase tracking-wider">Total Price</span>
              <span className="text-2xl font-black text-secondary">{formatCurrency(totalPrice)}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onClose}
                className="py-3 rounded-xl bg-surface text-muted font-bold hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="py-3 rounded-xl bg-primary text-white font-bold hover:bg-amber-900 shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
