import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Product, OrderStatus, Courier } from '../types';
import {
  ShoppingBag,
  ExternalLink,
  Search,
  Plus,
  Minus,
  Trash2,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  Truck,
  AlertCircle,
  Clock,
  Printer,
  X,
  Upload,
  ArrowRight,
  Filter,
  Package,
} from 'lucide-react';

interface ShowcaseShopProps {
  onOpenReceipt: (receipt: any) => void;
}

export const ShowcaseShop: React.FC<ShowcaseShopProps> = ({ onOpenReceipt }) => {
  const {
    currentUser,
    categories,
    products,
    cart,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    orders,
    createOrder,
    updateOrderStatus,
    cancelOrder,
    isDark,
  } = useStore();

  // Tab view: 'browse' | 'orders'
  const [activeSubView, setActiveSubView] = useState<'browse' | 'orders'>('browse');

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Notification message (e.g. "Only 2 left in stock!")
  const [stockAlert, setStockAlert] = useState<string | null>(null);

  // Cart Drawer & Checkout modal
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Checkout form fields
  const [customerName, setCustomerName] = useState(currentUser.name || '');
  const [contactNumber, setContactNumber] = useState(currentUser.phone || '+63 917 123 4567');
  const [email, setEmail] = useState(currentUser.email || '');
  const [address, setAddress] = useState(
    currentUser.address || 'Block 14 Lot 8, Jordan Plains Subd., Novaliches, QC'
  );
  const [paymentType, setPaymentType] = useState<'pay_now' | 'down_payment'>('pay_now');
  const [courier, setCourier] = useState<Courier>('lalamove');
  const [receiptPhoto, setReceiptPhoto] = useState<string>(
    'https://images.unsplash.com/photo-1554415707-9e49fe833683?auto=format&fit=crop&w=400&q=80'
  );
  const [receiptFileName, setReceiptFileName] = useState<string>('sample_receipt_proof.jpg');

  // Filtered products list - Only include products with available quantity (> 0)
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Do not show products with 0 quantity in the shop
      if (p.quantity <= 0) return false;

      const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.size.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);
  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Downpayment calculations: Pay 100 first, remainder is balance
  const downPaymentRequired = 100;
  const remainingBalance = Math.max(0, cartSubtotal - downPaymentRequired);

  // Handlers for cart
  const handleAddToCart = (product: Product) => {
    const res = addToCart(product, 1);
    if (!res.success) {
      setStockAlert(res.message);
      setTimeout(() => setStockAlert(null), 3500);
    } else {
      setStockAlert(`✓ ${res.message}`);
      setTimeout(() => setStockAlert(null), 2500);
    }
  };

  const handleQtyChange = (productId: string, delta: number) => {
    const res = updateCartQty(productId, delta);
    if (!res.success && res.message) {
      setStockAlert(res.message);
      setTimeout(() => setStockAlert(null), 3500);
    }
  };

  // Receipt image upload handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setReceiptPhoto(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Order
  const handleConfirmOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const newOrder = createOrder({
      customerId: currentUser.id,
      customerName: customerName.trim() || 'Online Customer',
      contactNumber: contactNumber.trim(),
      email: email.trim(),
      address: address.trim(),
      items: [...cart],
      totalAmount: cartSubtotal,
      paymentType,
      downPaymentAmount: paymentType === 'down_payment' ? downPaymentRequired : 0,
      remainingBalance: paymentType === 'down_payment' ? remainingBalance : 0,
      receiptImage: receiptPhoto,
      courier,
      notes: paymentType === 'down_payment' ? '₱100 Downpayment submitted with payment slip.' : 'Paid in full.',
    });

    setIsCheckoutOpen(false);
    setIsCartOpen(false);

    // Switch to orders view and offer print
    setActiveSubView('orders');
    onOpenReceipt({
      type: 'order',
      orderNumber: newOrder.orderNumber,
      orderDate: newOrder.orderDate,
      customerName: newOrder.customerName,
      contactNumber: newOrder.contactNumber,
      address: newOrder.address,
      courier: newOrder.courier,
      items: newOrder.items,
      totalAmount: newOrder.totalAmount,
      paymentType: newOrder.paymentType,
      downPaymentAmount: newOrder.downPaymentAmount,
      remainingBalance: newOrder.remainingBalance,
    });
  };

  // Order status badges & labels
  const statusConfig: Record<OrderStatus, { label: string; color: string; icon: any }> = {
    pending: { label: 'Pending Verification', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Clock },
    preparing_the_order: { label: 'Preparing the Order', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Package },
    dropped_to_courier: { label: 'Dropped to Courier', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: Truck },
    completed: { label: 'Completed', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle },
    cancelled: { label: 'Cancelled', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30', icon: AlertCircle },
  };

  // Visible orders based on user role:
  // Owner sees all orders ("New Orders"), Customer sees their own orders ("My Orders")
  const visibleOrders = useMemo(() => {
    if (currentUser.role === 'owner') return orders;
    return orders.filter(
      (o) =>
        o.customerId === currentUser.id ||
        o.email.toLowerCase() === currentUser.email.toLowerCase()
    );
  }, [orders, currentUser]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Stock Notification Banner */}
      {stockAlert && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-orange-600 text-white font-bold text-xs shadow-2xl flex items-center gap-2 border border-white/30 animate-bounce">
          <AlertCircle className="w-4 h-4" />
          <span>{stockAlert}</span>
        </div>
      )}

      {/* Online Showcase Store Hero Card */}
      <div
        className={`relative overflow-hidden rounded-3xl border transition-all ${
          isDark
            ? 'bg-gradient-to-r from-stone-950/90 via-amber-950/40 to-stone-950/90 border-orange-500/30'
            : 'bg-gradient-to-r from-orange-100/90 via-amber-50/90 to-orange-100/90 border-orange-200'
        } p-6 sm:p-8 backdrop-blur-2xl shadow-xl`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-black uppercase tracking-wider">
              <span>Showcase & Thrift Store</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              EXINS Jksur+ Novaliches Quezon City
            </h1>
            <p className="text-base sm:text-lg font-serif italic text-orange-300 font-semibold">
              “Your Next Favorite Outfit is Hiding Here.”
            </p>

            {/* Store Contact & Address */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-stone-300 pt-2 font-medium">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-orange-400" />
                <span>Novaliches, Quezon City, Metro Manila</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-orange-400" />
                <span>+63 917 123 4567 / (02) 8923-4567</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-orange-400" />
                <span>contact@exins-jksurplus.com</span>
              </span>
            </div>
          </div>

          {/* Action Buttons for Owner vs Customer */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Common Browse Clothing Button */}
            <button
              onClick={() => setActiveSubView('browse')}
              className={`px-5 py-3 rounded-2xl text-xs font-extrabold transition-all cursor-pointer shadow-lg flex items-center gap-2 ${
                activeSubView === 'browse'
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-orange-950/40'
                  : isDark
                  ? 'bg-stone-800 text-stone-200 hover:bg-stone-700'
                  : 'bg-white text-stone-800 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Browse Clothing</span>
            </button>

            {/* Owner Button: "New Orders" */}
            {currentUser.role === 'owner' && (
              <button
                onClick={() => setActiveSubView('orders')}
                className={`relative px-5 py-3 rounded-2xl text-xs font-extrabold transition-all cursor-pointer shadow-lg flex items-center gap-2 ${
                  activeSubView === 'orders'
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-orange-950/40'
                    : isDark
                    ? 'bg-stone-800 text-stone-200 hover:bg-stone-700'
                    : 'bg-white text-stone-800 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>New Orders ({orders.length})</span>
                {orders.filter((o) => o.status === 'pending').length > 0 && (
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-ping"></span>
                )}
              </button>
            )}

            {/* Customer Button: "My Orders" */}
            {currentUser.role === 'customer' && (
              <button
                onClick={() => setActiveSubView('orders')}
                className={`px-5 py-3 rounded-2xl text-xs font-extrabold transition-all cursor-pointer shadow-lg flex items-center gap-2 ${
                  activeSubView === 'orders'
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-orange-950/40'
                    : isDark
                    ? 'bg-stone-800 text-stone-200 hover:bg-stone-700'
                    : 'bg-white text-stone-800 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>My Orders ({visibleOrders.length})</span>
              </button>
            )}

            {/* View Bag / Cart trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="px-5 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold transition-all cursor-pointer shadow-lg flex items-center gap-2"
            >
              <span>View Cart Bag ({totalCartItems})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* SUBVIEW 1: BROWSE CLOTHING */}
      {activeSubView === 'browse' && (
        <div className="space-y-6">
          {/* Search Bar & Category Filter Bar */}
          <div
            className={`p-5 rounded-3xl border ${
              isDark ? 'bg-stone-900/80 border-orange-500/20' : 'bg-white/90 border-orange-200'
            } backdrop-blur-xl shadow-lg space-y-4`}
          >
            {/* Search Button & Input */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  placeholder="Search clothing by name, size, category (jackets, shoes, caps)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-11 pr-4 py-3 rounded-2xl text-xs border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    isDark
                      ? 'bg-stone-800/80 border-stone-700 text-white placeholder-stone-400'
                      : 'bg-stone-50 border-stone-300 text-stone-900 placeholder-stone-400'
                  }`}
                />
              </div>
              <button
                onClick={() => {}}
                className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-orange-950/30"
              >
                <Search className="w-4 h-4" />
                <span>Find Item</span>
              </button>
            </div>

            {/* Category Filter Pills (like shoes, jackets, caps...) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
              <span className="text-xs font-bold text-stone-400 flex items-center gap-1 pl-1">
                <Filter className="w-3.5 h-3.5" />
                <span>Categories:</span>
              </span>
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-orange-600 text-white shadow-md'
                    : isDark
                    ? 'bg-stone-800/70 text-stone-300 hover:bg-stone-700'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                All Apparel ({products.filter((p) => p.quantity > 0).length})
              </button>
              {categories.map((cat) => {
                const inStockCount = products.filter(
                  (p) => p.categoryId === cat.id && p.quantity > 0
                ).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedCategory === cat.id
                        ? 'bg-orange-600 text-white shadow-md'
                        : isDark
                        ? 'bg-stone-800/70 text-stone-300 hover:bg-stone-700'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: cat.color || '#ea580c' }}
                    />
                    <span>
                      {cat.name} ({inStockCount})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Cards Grid: (product image, size, product name, visit link, Price, description, add to bag) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((p) => {
              const isOutOfStock = p.quantity <= 0;
              const isLowStock = p.quantity > 0 && p.quantity <= 2;

              return (
                <div
                  key={p.id}
                  className={`group rounded-3xl border overflow-hidden transition-all duration-300 flex flex-col justify-between ${
                    isDark
                      ? 'bg-stone-900/80 border-orange-500/20 hover:border-orange-500/50 hover:shadow-orange-950/50'
                      : 'bg-white border-orange-200 hover:border-orange-300 shadow-md'
                  } backdrop-blur-xl hover:-translate-y-1 shadow-lg`}
                >
                  {/* Image & Badges */}
                  <div className="relative aspect-square w-full overflow-hidden bg-stone-800">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Size Badge */}
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-black/75 backdrop-blur-md text-white text-[11px] font-black border border-white/20">
                      Size: {p.size}
                    </div>

                    {/* Stock Alert Pill */}
                    {isOutOfStock ? (
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-xl bg-rose-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow">
                        Sold Out
                      </div>
                    ) : isLowStock ? (
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-xl bg-amber-500 text-black text-[10px] font-extrabold uppercase tracking-wider shadow animate-pulse">
                        Only {p.quantity} Left!
                      </div>
                    ) : null}
                  </div>

                  {/* Product Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      {/* Name & Visit Link */}
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-extrabold text-sm sm:text-base leading-snug line-clamp-2">
                          {p.name}
                        </h3>
                        {/* Visit link (opens in new tab) */}
                        {p.link && (
                          <a
                            href={p.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-stone-400 hover:text-orange-400 transition-colors shrink-0"
                            title="Visit item link in new tab"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-xs text-stone-400 mt-2 line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    </div>

                    {/* Price & Add to Bag */}
                    <div className="pt-3 border-t border-stone-800/40 space-y-3">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-xs text-stone-400 block">Retail Price</span>
                          <span className="text-xl font-black text-orange-500">
                            ₱{p.sellingPrice.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-stone-400 block font-mono">
                            {p.barcode}
                          </span>
                          <span className="text-[11px] text-stone-300 font-semibold">
                            {p.quantity} in stock
                          </span>
                        </div>
                      </div>

                      {/* Add to Bag Button */}
                      <button
                        onClick={() => handleAddToCart(p)}
                        disabled={isOutOfStock}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                          isOutOfStock
                            ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-orange-950/30 active:scale-98'
                        }`}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>{isOutOfStock ? 'Out of Stock' : 'Add to Bag'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-16 p-8 rounded-3xl border border-stone-800 bg-stone-900/50 backdrop-blur-xl">
              <ShoppingBag className="w-12 h-12 text-stone-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold">No garments matched your search</h3>
              <p className="text-xs text-stone-400 mt-1">
                Try searching for other apparel keywords or selecting "All Apparel".
              </p>
            </div>
          )}
        </div>
      )}

      {/* SUBVIEW 2: ORDERS MANAGEMENT / MY ORDERS */}
      {activeSubView === 'orders' && (
        <div className="space-y-6">
          <div
            className={`p-6 rounded-3xl border ${
              isDark ? 'bg-stone-900/80 border-orange-500/20' : 'bg-white/90 border-orange-200'
            } backdrop-blur-xl shadow-lg`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-black">
                  {currentUser.role === 'owner' ? 'Manage Customer Orders' : 'My Showcase Orders'}
                </h2>
                <p className="text-xs text-stone-400 mt-0.5">
                  {currentUser.role === 'owner'
                    ? 'Track downpayments, prepare shipments, and update courier drop status.'
                    : 'Track your pending items, review down payment receipt, or cancel orders.'}
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 self-start">
                Total: {visibleOrders.length} orders
              </span>
            </div>

            {/* Orders List */}
            <div className="space-y-4">
              {visibleOrders.map((ord) => {
                const StatusIcon = statusConfig[ord.status].icon;

                return (
                  <div
                    key={ord.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      isDark
                        ? 'bg-stone-800/60 border-stone-700/60 text-stone-100'
                        : 'bg-stone-50 border-stone-200 text-stone-900'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-700/40">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-orange-400">
                            {ord.orderNumber}
                          </span>
                          <span className="text-xs text-stone-400">({ord.orderDate})</span>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                              statusConfig[ord.status].color
                            }`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            <span>{statusConfig[ord.status].label}</span>
                          </span>
                        </div>
                        <div className="text-xs text-stone-300 mt-1">
                          <span className="font-bold">{ord.customerName}</span> | {ord.contactNumber} |{' '}
                          {ord.email}
                        </div>
                        <div className="text-[11px] text-stone-400 truncate max-w-xl">
                          📍 {ord.address}
                        </div>
                      </div>

                      {/* Financial info */}
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <span className="text-xs text-stone-400 block">Total Amount</span>
                          <span className="text-lg font-black text-orange-400">
                            ₱{ord.totalAmount.toLocaleString()}
                          </span>
                          {ord.paymentType === 'down_payment' && ord.remainingBalance > 0 && (
                            <span className="text-[11px] text-rose-400 font-bold block">
                              Balance: ₱{ord.remainingBalance.toLocaleString()}
                            </span>
                          )}
                        </div>

                        {/* Print Receipt Button */}
                        <button
                          onClick={() => onOpenReceipt(ord)}
                          className="p-2.5 rounded-xl border border-stone-600 hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer"
                          title="Print Receipt Slip"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Ordered Items Preview */}
                    <div className="py-3 flex flex-wrap items-center gap-3">
                      {ord.items.map((it, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-black/20 border border-stone-700/40 text-xs"
                        >
                          <img
                            src={it.product.image}
                            alt={it.product.name}
                            className="w-8 h-8 rounded-lg object-cover"
                          />
                          <div>
                            <span className="font-bold block truncate max-w-[140px]">
                              {it.product.name}
                            </span>
                            <span className="text-[10px] text-stone-400">
                              {it.quantity}x @ ₱{it.product.sellingPrice}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Bottom Action Bar: Owner status update vs Customer Cancel */}
                    <div className="pt-3 border-t border-stone-700/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="text-stone-400 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-orange-400" />
                        <span className="capitalize font-bold text-stone-300">Courier: {ord.courier}</span>
                        <span className="text-[10px] italic text-stone-400">
                          (Customer pays shipping fee directly to courier)
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* OWNER: Status Dropdown */}
                        {currentUser.role === 'owner' && (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-300 text-xs">Update Status:</span>
                            <select
                              value={ord.status}
                              onChange={(e) => updateOrderStatus(ord.id, e.target.value as OrderStatus)}
                              className="px-3 py-1.5 rounded-xl bg-stone-900 border border-orange-500/30 text-stone-100 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                            >
                              <option value="pending">Pending</option>
                              <option value="preparing_the_order">Preparing the Order</option>
                              <option value="dropped_to_courier">Dropped to Courier</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        )}

                        {/* CUSTOMER: Cancel Order Button */}
                        {currentUser.role === 'customer' &&
                          ord.status !== 'completed' &&
                          ord.status !== 'cancelled' && (
                            <button
                              onClick={() => {
                                if (confirm(`Cancel order ${ord.orderNumber}?`)) {
                                  cancelOrder(ord.id);
                                }
                              }}
                              className="px-3 py-1.5 rounded-xl border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 font-bold transition-colors cursor-pointer"
                            >
                              Cancel Order
                            </button>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {visibleOrders.length === 0 && (
                <div className="text-center py-12 text-stone-400">
                  <Package className="w-10 h-10 text-stone-500 mx-auto mb-2" />
                  <p>No orders recorded yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CART BAG DRAWER / MODAL */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div
            className={`w-full max-w-md h-full flex flex-col shadow-2xl border-l ${
              isDark
                ? 'bg-stone-900/95 border-orange-500/30 text-stone-100'
                : 'bg-white/95 border-orange-200 text-stone-900'
            } backdrop-blur-xl`}
          >
            {/* Cart Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-orange-500/20 bg-gradient-to-r from-orange-600/20 to-amber-600/20">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-orange-500" />
                <h3 className="font-extrabold text-base">Your Shopping Bag ({totalCartItems})</h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-lg hover:bg-stone-500/20 text-stone-400 hover:text-stone-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.map((item) => {
                const p = item.product;
                const itemTotal = p.sellingPrice * item.quantity;
                return (
                  <div
                    key={p.id}
                    className={`p-3.5 rounded-2xl border flex gap-3 items-center ${
                      isDark ? 'bg-stone-800/60 border-stone-700/60' : 'bg-stone-50 border-stone-200'
                    }`}
                  >
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-16 h-16 rounded-xl object-cover shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs truncate">{p.name}</h4>
                      <p className="text-[11px] text-stone-400">Size: {p.size}</p>
                      <p className="text-xs font-black text-orange-400 mt-1">
                        ₱{p.sellingPrice.toLocaleString()} each
                      </p>

                      {/* Quantity Controls (- or +) */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => handleQtyChange(p.id, -1)}
                          className="w-6 h-6 rounded-lg bg-stone-700/60 hover:bg-stone-600 text-stone-200 flex items-center justify-center cursor-pointer transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold px-2">{item.quantity}</span>
                        <button
                          onClick={() => handleQtyChange(p.id, 1)}
                          className="w-6 h-6 rounded-lg bg-stone-700/60 hover:bg-stone-600 text-stone-200 flex items-center justify-center cursor-pointer transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <span className="text-[10px] text-stone-400 pl-1">
                          (Max: {p.quantity})
                        </span>
                      </div>
                    </div>

                    {/* Delete and Total */}
                    <div className="flex flex-col items-end justify-between self-stretch">
                      <button
                        onClick={() => removeFromCart(p.id)}
                        className="text-stone-400 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                        title="Delete from Bag"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <span className="font-black text-xs">₱{itemTotal.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}

              {cart.length === 0 && (
                <div className="text-center py-16 text-stone-400 space-y-2">
                  <ShoppingBag className="w-12 h-12 mx-auto text-stone-500" />
                  <p className="text-sm font-bold">Your bag is empty.</p>
                  <p className="text-xs">Browse the clothing rack and add garments to your bag!</p>
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-stone-800 space-y-3 bg-stone-950/40">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-stone-400">Total Amount:</span>
                  <span className="text-xl font-black text-orange-500">
                    ₱{cartSubtotal.toLocaleString()}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={clearCart}
                    className="px-3 py-3 rounded-xl border border-stone-700 hover:bg-stone-800 text-xs font-bold text-stone-400 transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsCheckoutOpen(true);
                    }}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-xs shadow-lg shadow-orange-950/40 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL: Name, phone, email, address, Pay Now vs Down Payment, receipt photo upload, courier, note */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div
            className={`w-full max-w-xl rounded-3xl shadow-2xl border overflow-hidden my-8 ${
              isDark
                ? 'bg-stone-900 border-orange-500/30 text-stone-100'
                : 'bg-white border-orange-200 text-stone-900'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-orange-500/20 bg-gradient-to-r from-orange-600/20 to-amber-600/20">
              <h3 className="font-black text-lg">Checkout & Order Confirmation</h3>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1.5 rounded-lg hover:bg-stone-500/20 text-stone-400 hover:text-stone-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmOrder} className="p-6 space-y-5 text-xs">
              {/* Customer Contact Details */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-orange-400 uppercase tracking-wider">
                  1. Customer Delivery Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-300 font-semibold mb-1">Customer Name</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        isDark ? 'bg-stone-800 border-stone-700' : 'bg-white border-stone-300'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-stone-300 font-semibold mb-1">Contact Number</label>
                    <input
                      type="tel"
                      required
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        isDark ? 'bg-stone-800 border-stone-700' : 'bg-white border-stone-300'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-300 font-semibold mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        isDark ? 'bg-stone-800 border-stone-700' : 'bg-white border-stone-300'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-stone-300 font-semibold mb-1">Full Delivery Address</label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street, Barangay, City, Postal Code"
                      className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        isDark ? 'bg-stone-800 border-stone-700' : 'bg-white border-stone-300'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Payment Option: Pay Now or Down Payment */}
              <div className="space-y-3 pt-3 border-t border-stone-800">
                <h4 className="font-bold text-xs text-orange-400 uppercase tracking-wider">
                  2. Select Payment Option
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentType('pay_now')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      paymentType === 'pay_now'
                        ? 'border-orange-500 bg-orange-500/20 shadow-md ring-1 ring-orange-500'
                        : isDark
                        ? 'border-stone-800 bg-stone-800/60'
                        : 'border-stone-200 bg-stone-50'
                    }`}
                  >
                    <div className="font-bold text-xs text-orange-400">Pay Now (Full)</div>
                    <div className="text-[11px] text-stone-300 mt-1">
                      Total Due: <span className="font-bold">₱{cartSubtotal.toLocaleString()}</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentType('down_payment')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      paymentType === 'down_payment'
                        ? 'border-orange-500 bg-orange-500/20 shadow-md ring-1 ring-orange-500'
                        : isDark
                        ? 'border-stone-800 bg-stone-800/60'
                        : 'border-stone-200 bg-stone-50'
                    }`}
                  >
                    <div className="font-bold text-xs text-orange-400">Down Payment (₱100)</div>
                    <div className="text-[11px] text-stone-300 mt-1">
                      Remaining Balance:{' '}
                      <span className="font-bold text-red-400">₱{remainingBalance.toLocaleString()}</span>
                    </div>
                  </button>
                </div>

                {/* Upload Photo for Payment Proof Receipt */}
                <div className="pt-2">
                  <label className="block text-stone-300 font-semibold mb-1">
                    Upload Payment Receipt Proof (GCash / Bank Transfer)
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="px-4 py-2.5 rounded-xl border border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center gap-2 cursor-pointer transition-colors">
                      <Upload className="w-4 h-4 text-orange-400" />
                      <span>Choose Receipt Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[11px] text-stone-400 truncate max-w-[200px]">
                      {receiptFileName}
                    </span>
                  </div>
                  {receiptPhoto && (
                    <div className="mt-2 w-28 h-20 rounded-xl overflow-hidden border border-stone-700">
                      <img src={receiptPhoto} alt="Receipt preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              {/* Courier Selection & Note */}
              <div className="space-y-3 pt-3 border-t border-stone-800">
                <h4 className="font-bold text-xs text-orange-400 uppercase tracking-wider">
                  3. Select Delivery Courier
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'lbc', name: 'LBC Express', eta: '1-3 days' },
                    { id: 'lalamove', name: 'Lalamove (Same Day QC)', eta: 'Same day' },
                    { id: 'jnt', name: 'J&T Express', eta: '2-4 days' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCourier(c.id as Courier)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        courier === c.id
                          ? 'border-orange-500 bg-orange-500/20 font-bold'
                          : isDark
                          ? 'border-stone-800 bg-stone-800/40'
                          : 'border-stone-200 bg-stone-50'
                      }`}
                    >
                      <div className="font-black text-xs uppercase">{c.name}</div>
                      <div className="text-[10px] text-stone-400">{c.eta}</div>
                    </button>
                  ))}
                </div>

                {/* Explicit shipping note required by prompt */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>Shipping Policy Note:</strong> The customer will be the one to pay the shipping
                    fee directly to the courier rider upon delivery or dispatch.
                  </span>
                </div>
              </div>

              {/* Summary and Submit */}
              <div className="pt-4 border-t border-stone-800 space-y-3">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span>Payable Now:</span>
                  <span className="text-xl font-black text-orange-500">
                    ₱{paymentType === 'down_payment' ? '100.00' : cartSubtotal.toLocaleString()}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCheckoutOpen(false)}
                    className="w-1/3 py-3 rounded-xl border border-stone-700 hover:bg-stone-800 text-stone-300 font-bold cursor-pointer"
                  >
                    Back to Bag
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black rounded-xl text-xs shadow-lg shadow-orange-950/40 transition-all cursor-pointer"
                  >
                    Confirm Order & Print Receipt
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
