import React from 'react';
import { useStore } from '../context/StoreContext';
import { Printer, X, CheckCircle2 } from 'lucide-react';

export const ReceiptModal: React.FC = () => {
  const { selectedReceipt, setSelectedReceipt, isDark } = useStore();

  if (!selectedReceipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const isPos = selectedReceipt.type === 'pos';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div
        className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border ${
          isDark ? 'bg-stone-900 border-orange-500/30 text-stone-100' : 'bg-white border-orange-200 text-stone-900'
        }`}
      >
        {/* Modal Top Bar (hidden in print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-orange-500/20 bg-gradient-to-r from-orange-600/20 to-amber-600/20">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-lg">Transaction Receipt</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt</span>
            </button>
            <button
              onClick={() => setSelectedReceipt(null)}
              className="p-1.5 rounded-lg hover:bg-stone-500/20 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Thermal / Paper Receipt Body */}
        <div className="printable-area p-6 bg-white text-stone-900 font-mono text-xs selection:bg-orange-200">
          {/* Header */}
          <div className="text-center pb-4 border-b-2 border-dashed border-stone-400">
            <h1 className="text-xl font-black tracking-widest text-stone-950 uppercase">EXINS Jksur+</h1>
            <p className="text-[11px] text-stone-700 font-sans font-semibold">Novaliches, Quezon City, Metro Manila</p>
            <p className="text-[10px] text-stone-500 font-sans italic">“Your Next Favorite Outfit is Hiding Here”</p>
            <p className="text-[10px] text-stone-600 font-mono mt-1">Tel: +63 917 123 4567 | info@exins.ph</p>
            <div className="mt-2 inline-block px-2 py-0.5 bg-stone-100 rounded text-[10px] font-bold text-stone-800 uppercase tracking-wider">
              {isPos ? 'OFFICIAL POS SALES SLIP' : 'ONLINE SHOWCASE ORDER SLIP'}
            </div>
          </div>

          {/* Meta Details */}
          <div className="py-3 border-b border-dashed border-stone-300 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-stone-500">Ref #:</span>
              <span className="font-bold">{selectedReceipt.receiptNumber || selectedReceipt.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Date/Time:</span>
              <span>{selectedReceipt.date || selectedReceipt.orderDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Customer:</span>
              <span className="font-semibold">{selectedReceipt.customerName}</span>
            </div>
            {selectedReceipt.contactNumber && (
              <div className="flex justify-between">
                <span className="text-stone-500">Contact:</span>
                <span>{selectedReceipt.contactNumber}</span>
              </div>
            )}
            {selectedReceipt.address && (
              <div className="flex justify-between">
                <span className="text-stone-500">Address:</span>
                <span className="max-w-[180px] text-right truncate">{selectedReceipt.address}</span>
              </div>
            )}
            {selectedReceipt.courier && (
              <div className="flex justify-between uppercase">
                <span className="text-stone-500">Courier:</span>
                <span className="font-bold text-orange-700">{selectedReceipt.courier} (Buyer pays shipping)</span>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="py-3 border-b-2 border-dashed border-stone-400">
            <div className="flex justify-between font-bold text-[11px] pb-1 border-b border-stone-200 mb-1">
              <span>ITEM / QTY</span>
              <span>AMOUNT</span>
            </div>
            <div className="space-y-1.5">
              {selectedReceipt.items.map((item: any, idx: number) => {
                const p = item.product;
                const itemTotal = p.sellingPrice * item.quantity;
                return (
                  <div key={idx} className="flex justify-between items-start text-[11px]">
                    <div className="max-w-[220px]">
                      <div className="font-bold truncate">{p.name}</div>
                      <div className="text-[10px] text-stone-500">
                        {p.size ? `Size: ${p.size} | ` : ''}
                        {item.quantity}x @ ₱{p.sellingPrice.toLocaleString()}
                      </div>
                    </div>
                    <div className="font-bold whitespace-nowrap">₱{itemTotal.toLocaleString()}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Calculations */}
          <div className="py-3 border-b-2 border-dashed border-stone-400 space-y-1.5 text-[11px]">
            {isPos ? (
              <>
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal:</span>
                  <span>₱{selectedReceipt.subtotal.toLocaleString()}</span>
                </div>
                {selectedReceipt.discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Discount:</span>
                    <span>-₱{selectedReceipt.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-stone-950 pt-1 border-t border-stone-200">
                  <span>TOTAL DUE:</span>
                  <span>₱{selectedReceipt.totalDue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-1 text-stone-600">
                  <span className="uppercase">Paid ({selectedReceipt.paymentMethod}):</span>
                  <span>₱{selectedReceipt.amountTendered.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-stone-900">
                  <span>Change:</span>
                  <span>₱{selectedReceipt.change.toLocaleString()}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between text-sm font-black text-stone-950">
                  <span>TOTAL AMOUNT:</span>
                  <span>₱{selectedReceipt.totalAmount.toLocaleString()}</span>
                </div>
                {selectedReceipt.paymentType === 'down_payment' ? (
                  <>
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>DOWN PAYMENT PAID:</span>
                      <span>₱100.00</span>
                    </div>
                    <div className="flex justify-between text-red-600 font-bold pt-1 border-t border-stone-200">
                      <span>REMAINING BALANCE:</span>
                      <span>₱{selectedReceipt.remainingBalance.toLocaleString()}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>PAYMENT STATUS:</span>
                    <span>PAID IN FULL (₱{selectedReceipt.totalAmount.toLocaleString()})</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="text-center pt-4 text-[10px] text-stone-600 space-y-1">
            <p className="font-bold">THANK YOU FOR SUPPORTING EXINS THRIFT SURPLUS!</p>
            <p>Please keep this receipt for return or exchange within 3 days.</p>
            <p className="text-[9px] text-stone-400">System generated via EXINS POS & Inventory Suite</p>
          </div>
        </div>

        {/* Modal Bottom Footer (hidden in print) */}
        <div className="no-print p-4 bg-stone-950/40 border-t border-stone-800 flex justify-end">
          <button
            onClick={() => setSelectedReceipt(null)}
            className="px-4 py-2 bg-stone-700 hover:bg-stone-600 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
