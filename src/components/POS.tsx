import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Product, CartItem, PaymentMethod } from '../types';
import {
  Calculator,
  Barcode,
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  CheckCircle2,
  Tag,
  CreditCard,
  Banknote,
  Smartphone,
  User,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react';

interface POSProps {
  onOpenReceipt: (receipt: any) => void;
}

export const POS: React.FC<POSProps> = ({ onOpenReceipt }) => {
  const { products, categories, processPosSale, isDark } = useStore();

  // POS State
  const [barcodeInput, setBarcodeInput] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [customerName, setCustomerName] = useState('');
  const [posCart, setPosCart] = useState<CartItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [isDiscountInputOpen, setIsDiscountInputOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountTendered, setAmountTendered] = useState<number | ''>('');
  const [posAlert, setPosAlert] = useState<string | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Auto focus barcode input on load
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // Filtered store catalog for quick click
  const filteredCatalog = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
      const matchSearch =
        p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        p.barcode.toLowerCase().includes(catalogSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, catalogSearch]);

  // Handle typing barcode code directly (no scanner required!)
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim().toUpperCase();
    if (!code) return;

    const matchedProduct = products.find(
      (p) =>
        p.barcode.toUpperCase() === code ||
        p.barcode.toUpperCase().replace(/\s/g, '') === code.replace(/\s/g, '') ||
        p.name.toLowerCase().includes(code.toLowerCase())
    );

    if (!matchedProduct) {
      setPosAlert(`No item found matching code "${barcodeInput}". Try typing EXINS-1049`);
      setTimeout(() => setPosAlert(null), 3500);
      return;
    }

    addItemToPosCart(matchedProduct);
    setBarcodeInput('');
    barcodeInputRef.current?.focus();
  };

  // Add item to POS Cart with stock check
  const addItemToPosCart = (product: Product) => {
    if (product.quantity <= 0) {
      setPosAlert(`"${product.name}" is out of stock!`);
      setTimeout(() => setPosAlert(null), 3500);
      return;
    }

    setPosCart((prev) => {
      const existing = prev.find((it) => it.product.id === product.id);
      const curQty = existing ? existing.quantity : 0;

      if (curQty + 1 > product.quantity) {
        setPosAlert(`Only ${product.quantity} left in stock for "${product.name}"!`);
        setTimeout(() => setPosAlert(null), 3500);
        return prev;
      }

      if (existing) {
        return prev.map((it) =>
          it.product.id === product.id ? { ...it, quantity: it.quantity + 1 } : it
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdatePosQty = (productId: string, delta: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    setPosCart((prev) => {
      const item = prev.find((it) => it.product.id === productId);
      if (!item) return prev;

      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        return prev.filter((it) => it.product.id !== productId);
      }
      if (newQty > product.quantity) {
        setPosAlert(`Only ${product.quantity} units available in stock!`);
        setTimeout(() => setPosAlert(null), 3500);
        return prev;
      }
      return prev.map((it) => (it.product.id === productId ? { ...it, quantity: newQty } : it));
    });
  };

  const handleRemoveItem = (productId: string) => {
    setPosCart((prev) => prev.filter((it) => it.product.id !== productId));
  };

  const clearPosCart = () => {
    setPosCart([]);
    setDiscountAmount(0);
    setAmountTendered('');
    setCustomerName('');
  };

  // Calculations
  const subtotal = posCart.reduce((sum, it) => sum + it.product.sellingPrice * it.quantity, 0);
  const totalDue = Math.max(0, subtotal - discountAmount);
  const numTendered = typeof amountTendered === 'number' ? amountTendered : 0;
  const change = Math.max(0, numTendered - totalDue);

  // Confirm Transaction Handler
  const handleConfirmTransaction = () => {
    if (posCart.length === 0) {
      setPosAlert('Current cart bag is empty!');
      setTimeout(() => setPosAlert(null), 3000);
      return;
    }

    if (numTendered < totalDue && paymentMethod === 'cash') {
      setPosAlert(`Amount tendered (₱${numTendered}) is less than total due (₱${totalDue})!`);
      setTimeout(() => setPosAlert(null), 3500);
      return;
    }

    const { success, receiptData } = processPosSale({
      customerName: customerName || 'Walk-in Customer',
      items: [...posCart],
      subtotal,
      discount: discountAmount,
      totalDue,
      paymentMethod,
      amountTendered: paymentMethod === 'gcash' ? totalDue : numTendered,
      change: paymentMethod === 'gcash' ? 0 : change,
    });

    if (success) {
      clearPosCart();
      onOpenReceipt(receiptData);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Alert toast */}
      {posAlert && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-orange-600 text-white font-bold text-xs shadow-2xl flex items-center gap-2 border border-white/30 animate-bounce">
          <AlertCircle className="w-4 h-4" />
          <span>{posAlert}</span>
        </div>
      )}

      {/* POS Top Bar with Barcode Code Direct Input */}
      <div
        className={`p-6 rounded-3xl border ${
          isDark ? 'bg-stone-900/80 border-orange-500/20' : 'bg-white/90 border-orange-200'
        } backdrop-blur-xl shadow-lg`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-orange-400 font-bold text-xs uppercase tracking-wider mb-1">
              <Calculator className="w-4 h-4" />
              <span>Novaliches Storefront Counter</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">EXINS POS Terminal</h1>
            <p className="text-xs text-stone-400 mt-0.5">
              Type product code directly (e.g. <strong className="text-orange-300">EXINS-1049</strong>) or click clothing from catalog.
            </p>
          </div>

          {/* Product Code Direct Entry Form */}
          <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-2 w-full md:w-96">
            <div className="relative flex-1">
              <Tag className="w-5 h-5 text-orange-400 absolute left-3.5 top-3" />
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="Enter Product Code (e.g. EXINS-1049)..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className={`w-full pl-11 pr-4 py-2.5 rounded-2xl text-xs font-mono font-bold uppercase border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-stone-100 border-stone-300 text-stone-900'
                }`}
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-orange-950/30 cursor-pointer shrink-0"
            >
              Add Item
            </button>
          </form>
        </div>
      </div>

      {/* POS Two-Column Workspace: Left Catalog, Right Current Cart Bag */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Store Catalog (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div
            className={`p-5 rounded-3xl border ${
              isDark ? 'bg-stone-900/80 border-orange-500/20' : 'bg-white/90 border-orange-200'
            } backdrop-blur-xl shadow-lg space-y-4`}
          >
            {/* Catalog search and category filter pills */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Quick search garments..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-stone-100 border-stone-300'
                  }`}
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-stone-100 border-stone-300'
                }`}
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Click Item Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[580px] overflow-y-auto pr-1">
              {filteredCatalog.map((p) => {
                const isOutOfStock = p.quantity <= 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => addItemToPosCart(p)}
                    disabled={isOutOfStock}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      isOutOfStock
                        ? 'opacity-40 cursor-not-allowed bg-stone-900 border-stone-800'
                        : isDark
                        ? 'bg-stone-800/60 border-stone-700/60 hover:border-orange-500 hover:bg-stone-800'
                        : 'bg-stone-50 border-stone-200 hover:border-orange-300 hover:bg-white shadow-sm'
                    }`}
                  >
                    <div className="aspect-square w-full rounded-xl overflow-hidden mb-2 bg-stone-900">
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="font-bold text-xs truncate text-stone-100">{p.name}</div>
                      <div className="text-[10px] text-stone-400">
                        Size: {p.size} | Stock: {p.quantity}
                      </div>
                      <div className="font-mono text-[10px] text-orange-400 font-bold">{p.barcode}</div>
                    </div>
                    <div className="mt-2 font-black text-sm text-emerald-400">
                      ₱{p.sellingPrice.toLocaleString()}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Current Cart Bag, Calculations & Checkout (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div
            className={`p-6 rounded-3xl border ${
              isDark ? 'bg-stone-900/90 border-orange-500/20' : 'bg-white/95 border-orange-200'
            } backdrop-blur-xl shadow-xl space-y-5`}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-orange-500" />
                <h3 className="font-black text-base">Current Cart Bag</h3>
              </div>
              <button
                onClick={clearPosCart}
                className="text-xs text-stone-400 hover:text-rose-400 transition-colors cursor-pointer"
              >
                Clear Cart
              </button>
            </div>

            {/* Enter Customer Name (Optional) */}
            <div>
              <label className="block text-stone-300 text-xs font-semibold mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-orange-400" />
                <span>Customer Name (Optional)</span>
              </label>
              <input
                type="text"
                placeholder="Walk-in Shopper"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className={`w-full px-3.5 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-stone-100 border-stone-300'
                }`}
              />
            </div>

            {/* List all items in current cart bag */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {posCart.map((item) => {
                const p = item.product;
                const lineTotal = p.sellingPrice * item.quantity;

                return (
                  <div
                    key={p.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                      isDark ? 'bg-stone-800/40 border-stone-700/50' : 'bg-stone-50 border-stone-200'
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="font-bold truncate text-stone-100">{p.name}</div>
                      <div className="text-[10px] text-stone-400">
                        {p.size ? `Size: ${p.size} | ` : ''}
                        ₱{p.sellingPrice.toLocaleString()} ea
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleUpdatePosQty(p.id, -1)}
                        className="w-5 h-5 rounded bg-stone-700 hover:bg-stone-600 text-white flex items-center justify-center cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold px-1.5 text-center min-w-[20px]">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdatePosQty(p.id, 1)}
                        className="w-5 h-5 rounded bg-stone-700 hover:bg-stone-600 text-white flex items-center justify-center cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleRemoveItem(p.id)}
                        className="text-stone-400 hover:text-rose-400 p-1 cursor-pointer ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="font-black text-orange-400 ml-3 min-w-[65px] text-right">
                      ₱{lineTotal.toLocaleString()}
                    </div>
                  </div>
                );
              })}

              {posCart.length === 0 && (
                <div className="text-center py-8 text-stone-500 text-xs italic">
                  No items in POS cart. Scan or select from catalog.
                </div>
              )}
            </div>

            {/* Total Amount, Discount Button, Total Amount Due */}
            <div className="pt-3 border-t border-stone-800 space-y-2 text-xs">
              <div className="flex justify-between items-center text-stone-300">
                <span>Subtotal Amount:</span>
                <span className="font-bold text-sm">₱{subtotal.toLocaleString()}</span>
              </div>

              {/* Add Discount Button & Field */}
              <div className="flex items-center justify-between">
                {!isDiscountInputOpen ? (
                  <button
                    type="button"
                    onClick={() => setIsDiscountInputOpen(true)}
                    className="text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>+ Add Discount</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 w-full justify-between">
                    <span className="text-stone-300 font-semibold">Discount (₱):</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={discountAmount || ''}
                        onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                        className="w-24 px-2 py-1 bg-stone-800 border border-orange-500/40 rounded-lg text-right font-bold text-emerald-400 focus:outline-none text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setIsDiscountInputOpen(false)}
                        className="text-[11px] text-stone-400 hover:text-white"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}

                {discountAmount > 0 && !isDiscountInputOpen && (
                  <span className="font-bold text-emerald-400">-₱{discountAmount.toLocaleString()}</span>
                )}
              </div>

              <div className="flex justify-between items-center text-sm font-black text-white pt-2 border-t border-stone-800">
                <span>Total Amount Due:</span>
                <span className="text-2xl font-black text-orange-500">
                  ₱{totalDue.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Select Payment Method: Cash or GCash */}
            <div className="space-y-2 pt-2 border-t border-stone-800 text-xs">
              <label className="block text-stone-300 font-semibold">Select Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    paymentMethod === 'cash'
                      ? 'border-orange-500 bg-orange-500/20 text-white font-black shadow-md'
                      : isDark
                      ? 'border-stone-800 bg-stone-800 text-stone-400'
                      : 'border-stone-200 bg-stone-100 text-stone-700'
                  }`}
                >
                  <Banknote className="w-4 h-4 text-emerald-400" />
                  <span>Cash Payment</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('gcash')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    paymentMethod === 'gcash'
                      ? 'border-orange-500 bg-orange-500/20 text-white font-black shadow-md'
                      : isDark
                      ? 'border-stone-800 bg-stone-800 text-stone-400'
                      : 'border-stone-200 bg-stone-100 text-stone-700'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-blue-400" />
                  <span>GCash Digital</span>
                </button>
              </div>
            </div>

            {/* Amount Tendered & Automatic Change Calculation */}
            {paymentMethod === 'cash' && (
              <div className="space-y-3 pt-2 text-xs">
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">
                    Amount Tendered (₱ Cash Received)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Enter cash given by customer..."
                    value={amountTendered}
                    onChange={(e) =>
                      setAmountTendered(e.target.value ? Number(e.target.value) : '')
                    }
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-base font-black font-mono focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      isDark
                        ? 'bg-stone-800 border-stone-700 text-emerald-400'
                        : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  />
                </div>

                <div className="p-3 rounded-xl bg-stone-800/40 border border-stone-700/60 flex justify-between items-center font-bold">
                  <span className="text-stone-300">Customer Change:</span>
                  <span
                    className={`text-lg font-black font-mono ${
                      change > 0 ? 'text-emerald-400' : 'text-stone-400'
                    }`}
                  >
                    ₱{change.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Confirm Transaction & Print Receipt Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleConfirmTransaction}
                disabled={posCart.length === 0}
                className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:opacity-40 text-white font-black rounded-2xl text-xs shadow-lg shadow-orange-950/40 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Transaction & Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
