import React from 'react';
import { useStore } from '../context/StoreContext';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  DollarSign,
  TrendingUp,
  Barcode,
  Calculator,
  Moon,
  Sun,
  UserCheck,
  ShoppingCart,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { UserRole } from '../types';

interface NavbarProps {
  onOpenCart: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCart, onOpenAuth }) => {
  const {
    currentUser,
    switchRole,
    isDark,
    toggleTheme,
    activeTab,
    setActiveTab,
    cart,
    resetAllData,
    isFirebaseConnected,
  } = useStore();

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Available navigation items based on User Role limitations:
  // 1. Owner: can see all of this
  // 2. Staff: can use the POS, Inventory Management (Bale management, product categories, products list)
  // 3. Customer: can only use the online showcase product
  const getNavLinks = () => {
    if (currentUser.role === 'customer') {
      return [{ id: 'shop', label: 'Showcase Shop', icon: ShoppingBag }];
    }

    if (currentUser.role === 'staff') {
      return [
        { id: 'pos', label: 'POS Terminal', icon: Calculator },
        { id: 'inventory', label: 'Inventory', icon: Package },
        { id: 'barcode', label: 'Barcode', icon: Barcode },
        { id: 'shop', label: 'Showcase Shop', icon: ShoppingBag },
      ];
    }

    // Owner gets all modules
    return [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'shop', label: 'Showcase Shop', icon: ShoppingBag },
      { id: 'inventory', label: 'Inventory', icon: Package },
      { id: 'finance', label: 'Finance', icon: DollarSign },
      { id: 'forecasting', label: 'Forecasting', icon: TrendingUp },
      { id: 'barcode', label: 'Barcode', icon: Barcode },
      { id: 'pos', label: 'POS', icon: Calculator },
    ];
  };

  const navLinks = getNavLinks();

  const roleLabels: Record<UserRole, { title: string; color: string }> = {
    owner: { title: 'Store Owner', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    staff: { title: 'Staff Member', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    customer: { title: 'Shopper (Customer)', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-colors backdrop-blur-xl border-b ${
        isDark
          ? 'bg-stone-950/85 border-orange-500/20 text-stone-100'
          : 'bg-white/90 border-orange-300/40 text-stone-900 shadow-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo & Store Identity */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab(currentUser.role === 'customer' ? 'shop' : 'dashboard')}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-600 to-amber-700 p-0.5 shadow-lg shadow-orange-950/30 flex items-center justify-center text-white font-black text-xl tracking-tighter">
                EX
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-orange-500 via-amber-500 to-amber-300 bg-clip-text text-transparent">
                    EXINS
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-bold border border-orange-500/30">
                    Jksur+
                  </span>
                </div>
                <p className="text-[10px] text-stone-400 tracking-wide font-medium">Novaliches, Quezon City</p>
              </div>
            </button>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1">
            {navLinks.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-900/30'
                      : isDark
                      ? 'text-stone-300 hover:text-white hover:bg-stone-800/60'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Tools: Role Switcher, Cart, Dark Mode, Profile */}
          <div className="flex items-center gap-2.5">
            {/* Firebase Live Cloud Status Indicator */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold border ${
                isFirebaseConnected
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              }`}
              title={isFirebaseConnected ? 'Firebase Firestore & Auth Connected' : 'Connecting to Firebase Cloud...'}
            >
              <span className={`w-2 h-2 rounded-full ${isFirebaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="hidden md:inline">{isFirebaseConnected ? 'Firebase Cloud' : 'Firebase Sync'}</span>
            </div>

            {/* Quick Role Switcher for seamless testing */}
            <div className="hidden sm:flex items-center gap-1 p-1 rounded-xl bg-stone-800/40 border border-orange-500/20 text-xs">
              <span className="px-2 py-1 text-[11px] text-stone-400 font-medium">Role:</span>
              {(['owner', 'staff', 'customer'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => switchRole(r)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-all cursor-pointer ${
                    currentUser.role === r
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-700/50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Shopping Bag Button (Available for all to inspect cart) */}
            <button
              onClick={onOpenCart}
              className="relative p-2.5 rounded-xl border border-orange-500/25 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 transition-colors cursor-pointer"
              title="View Shopping Bag"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalCartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-gradient-to-r from-orange-600 to-red-600 text-white text-[11px] font-black flex items-center justify-center shadow-lg border border-white/40">
                  {totalCartCount}
                </span>
              )}
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                isDark
                  ? 'border-stone-700 bg-stone-800/80 text-amber-400 hover:bg-stone-700'
                  : 'border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100'
              }`}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* User Profile / Auth Button */}
            <button
              onClick={onOpenAuth}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                roleLabels[currentUser.role].color
              }`}
              title="Click to Switch User / Login / Signup"
            >
              <UserCheck className="w-4 h-4" />
              <span className="hidden md:inline">{currentUser.name.split(' ')[0]}</span>
              <span className="text-[10px] uppercase tracking-wide opacity-80">({currentUser.role})</span>
            </button>

            {/* Reset Data for Testing */}
            <button
              onClick={() => {
                if (confirm('Reset store data back to initial default values?')) {
                  resetAllData();
                }
              }}
              className="p-2 rounded-xl text-stone-500 hover:text-orange-400 hover:bg-stone-800/40 transition-colors cursor-pointer"
              title="Reset Sample Data"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto pb-3 pt-1 border-t border-orange-500/10">
          {navLinks.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-orange-600 text-white'
                    : isDark
                    ? 'text-stone-300 hover:bg-stone-800'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
