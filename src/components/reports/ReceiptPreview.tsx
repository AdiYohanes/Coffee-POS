"use client";

import React from "react";
import { format } from "date-fns";

interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  price: string;
  subtotal: string;
}

interface ReceiptData {
  id: string;
  createdAt: Date;
  subtotal: string;
  tax: string;
  total: string;
  user: { name: string };
  orderItems: Array<{
    id: string;
    quantity: number;
    unitPrice: string;
    subtotal: string;
    item: { name: string };
  }>;
}

interface Props {
  data: ReceiptData;
}

/**
 * ReceiptPreview provides a visual representation of the thermal receipt.
 * Optimized for 80mm width thermal printers.
 */
export default function ReceiptPreview({ data }: Props) {
  return (
    <div className="receipt-container bg-white text-black p-4 shadow-inner">
      <div className="receipt-header">
        <h1 className="text-xl font-bold uppercase tracking-widest">Coffee POS</h1>
        <p className="text-xs">123 Brew Street, Caffeine City</p>
        <p className="text-xs">Tel: (555) 012-3456</p>
      </div>

      <div className="receipt-info my-4 text-xs">
        <div className="flex justify-between">
          <span>Order #:</span>
          <span className="font-mono">{data.id}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{format(new Date(data.createdAt), "dd/MM/yyyy HH:mm")}</span>
        </div>
        <div className="flex justify-between">
          <span>Cashier:</span>
          <span>{data.user.name}</span>
        </div>
      </div>

      <div className="receipt-items border-t border-b border-black border-dashed py-2">
        <div className="flex justify-between font-bold mb-1">
          <span className="w-1/2">Item</span>
          <span className="w-1/6 text-right">Qty</span>
          <span className="w-1/3 text-right">Total</span>
        </div>
        {data.orderItems.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="w-1/2 truncate">{item.item.name}</span>
            <span className="w-1/6 text-right">{item.quantity}</span>
            <span className="w-1/3 text-right">${parseFloat(item.subtotal).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="receipt-total-section mt-4 text-sm">
        <div className="flex justify-between mb-1">
          <span>Subtotal</span>
          <span>${parseFloat(data.subtotal).toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-1">
          <span>Tax</span>
          <span>${parseFloat(data.tax).toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg mt-2 border-t border-black pt-2">
          <span>TOTAL</span>
          <span>${parseFloat(data.total).toFixed(2)}</span>
        </div>
      </div>

      <div className="receipt-footer mt-8 italic">
        <p className="text-center text-xs">Thank you for your visit!</p>
        <p className="text-center text-xs">Please come again.</p>
        <div className="mt-4 flex justify-center">
          {/* Mock Barcode placeholder */}
          <div className="h-8 w-48 bg-black/10 flex items-center justify-center text-[10px] font-mono border border-black/20">
            |||| || ||||| ||| || ||||
          </div>
        </div>
      </div>
    </div>
  );
}
