"use client";

import React from "react";
import { format } from "date-fns";
import { X, Printer } from "lucide-react";
import "../../styles/print.css";

interface ReceiptPreviewProps {
  order: any;
  onClose: () => void;
}

export default function ReceiptPreview({ order, onClose }: ReceiptPreviewProps) {
  const handlePrint = () => {
    window.print();
  };

  if (!order) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300 no-print">
      <div className="flex flex-col gap-4 max-h-[90vh]">
        {/* Actions Header */}
        <div className="flex items-center justify-between gap-4 px-2">
          <h2 className="text-white font-bold">Receipt Preview</h2>
          <div className="flex gap-2">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-all shadow-lg hover:shadow-violet-500/20"
              aria-label="Print Receipt"
            >
              <Printer className="w-4 h-4" />
              Print (P)
            </button>
            <button 
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
              aria-label="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Receipt Container */}
        <div className="overflow-y-auto rounded-xl">
          <div className="receipt-preview-screen" id="receipt-to-print">
            <div className="receipt-header">
              <h1 className="text-xl font-bold uppercase tracking-widest">Coffee POS</h1>
              <p className="text-xs">123 Espresso Avenue, Java City</p>
              <p className="text-xs">Tel: (555) 000-1234</p>
              <div className="receipt-divider" />
              <p className="font-bold">RECEIPT</p>
              <p>#{order.id}</p>
              <p>{format(new Date(order.createdAt), "dd/MM/yyyy HH:mm:ss")}</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold border-b border-black pb-1">
                <span>ITEM</span>
                <span>TOTAL</span>
              </div>
              
              {order.orderItems?.map((item: any) => (
                <div key={item.id} className="space-y-0.5">
                  <div className="flex justify-between text-xs">
                    <span>{item.quantity}x {item.item.name}</span>
                    <span>${Number(item.subtotal).toFixed(2)}</span>
                  </div>
                  {item.orderModifiers?.map((om: any) => (
                    <div key={om.id} className="flex justify-between text-[10px] pl-4 italic">
                      <span>+ {om.modifier.name}</span>
                      <span>${Number(om.price).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="receipt-divider" />

            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${Number(order.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax (10%)</span>
                <span>${Number(order.tax).toFixed(2)}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Discount</span>
                  <span>-${Number(order.discount).toFixed(2)}</span>
                </div>
              )}
              <div className="receipt-divider" />
              <div className="flex justify-between text-lg font-bold">
                <span>TOTAL</span>
                <span>${Number(order.total).toFixed(2)}</span>
              </div>
            </div>

            <div className="receipt-divider" />
            
            <div className="receipt-footer">
              <p>Cashier: {order.user.name}</p>
              <p className="mt-4 font-bold">THANK YOU FOR YOUR VISIT!</p>
              <p>Visit us at www.coffeepos.com</p>
              <div className="mt-4 flex justify-center">
                {/* Simple Barcode Placeholder */}
                <div className="h-8 w-48 bg-black/10 flex items-center justify-center text-[8px] tracking-[0.5em]">
                  *{order.id}*
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden container for actual printing */}
      <div className="hidden print:block">
        <div className="receipt-container">
          <div className="receipt-header">
            <h1 style={{ fontSize: '18px', fontWeight: 'bold' }}>COFFEE POS</h1>
            <p>123 Espresso Avenue, Java City</p>
            <div className="receipt-divider" />
            <p>RECEIPT #{order.id}</p>
            <p>{format(new Date(order.createdAt), "dd/MM/yyyy HH:mm:ss")}</p>
          </div>

          <div className="receipt-divider" />

          {order.orderItems?.map((item: any) => (
            <div key={item.id}>
              <div className="receipt-item">
                <span>{item.quantity}x {item.item.name}</span>
                <span>${Number(item.subtotal).toFixed(2)}</span>
              </div>
              {item.orderModifiers?.map((om: any) => (
                <div key={om.id} className="receipt-modifier">
                  + {om.modifier.name} (${Number(om.price).toFixed(2)})
                </div>
              ))}
            </div>
          ))}

          <div className="receipt-divider" />

          <div className="receipt-item">
            <span>Subtotal</span>
            <span>${Number(order.subtotal).toFixed(2)}</span>
          </div>
          <div className="receipt-item">
            <span>Tax</span>
            <span>${Number(order.tax).toFixed(2)}</span>
          </div>
          <div className="receipt-divider" />
          <div className="receipt-item receipt-total">
            <span>TOTAL</span>
            <span>${Number(order.total).toFixed(2)}</span>
          </div>

          <div className="receipt-divider" />
          <div className="receipt-footer">
            <p>Cashier: {order.user.name}</p>
            <p style={{ fontWeight: 'bold', marginTop: '10px' }}>THANK YOU!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
