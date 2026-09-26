import React from 'react';
import { useStore } from '../context/StoreContext';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  DollarSign,
  TrendingUp,
  Calculator,
  Moon,
  Sun,
  UserCheck,
  ShoppingCart,
  RotateCcw,
  Bot,
} from 'lucide-react';
import { UserRole } from '../types';

interface NavbarProps {
  onOpenCart: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCart, onOpenAuth }) => {
  const {
    currentUser,
    isDark,
    toggleTheme,
    activeTab,
    setActiveTab,
    cart,
    resetAllData,
    isFirebaseConnected,
  } = useStore();

  const isGuest = !currentUser.email || currentUser.id === 'guest' || currentUser.id === 'user-guest';
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const [showResetModal, setShowResetModal] = React.useState(false);
  const [resetNotice, setResetNotice] = React.useState(false);

  // Available navigation items based on User Role:
  // Barcode section is removed.
  const getNavLinks = () => {
    if (currentUser.role === 'customer') {
      return [{ id: 'shop', label: 'Showcase Shop', icon: ShoppingBag }];
    }

    if (currentUser.role === 'staff') {
      return [
        { id: 'pos', label: 'POS Terminal', icon: Calculator },
        { id: 'inventory', label: 'Inventory Management', icon: Package },
        { id: 'shop', label: 'Showcase Shop', icon: ShoppingBag },
      ];
    }

    // Owner gets all core modules (excluding barcode)
    return [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'shop', label: 'Showcase Shop', icon: ShoppingBag },
      { id: 'inventory', label: 'Inventory Management', icon: Package },
      { id: 'finance', label: 'Finance & Accounts', icon: DollarSign },
      { id: 'forecasting', label: 'Sales Forecasting', icon: TrendingUp },
      { id: 'pos', label: 'POS Terminal', icon: Calculator },
      { id: 'ai', label: 'AI Advisor', icon: Bot, isAi: true },
    ];
  };

  const navLinks = getNavLinks();

  const roleLabels: Record<UserRole, { title: string; color: string }> = {
    owner: { title: 'Owner', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    staff: { title: 'Staff', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    customer: { title: 'Customer', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
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
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-600 to-amber-700 p-0.5 shadow-lg shadow-orange-950/40 flex items-center justify-center text-white font-black text-xl tracking-tighter transition-transform group-hover:scale-105">
                EX
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-orange-500 via-amber-500 to-amber-300 bg-clip-text text-transparent">
                    EXINS
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-orange-500/20 text-orange-400 font-bold border border-orange-500/30">
                    Jksur+
                  </span>
                </div>
                <p className="text-[10px] text-stone-400 tracking-wide font-medium">Novaliches, Quezon City</p>
              </div>
            </button>
          </div>

          {/* Center Navigation Tabs: ICON ONLY WITH SLEEK TOOLTIP ON HOVER */}
          <nav className="hidden md:flex items-center gap-2 py-1 px-3 rounded-2xl bg-stone-900/40 border border-stone-800/60 backdrop-blur-md">
            {navLinks.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <div key={tab.id} className="relative group flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    aria-label={tab.label}
                    className={`p-3 rounded-xl transition-all cursor-pointer flex items-center justify-center relative ${
                      isActive
                        ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-950/50 scale-105'
                        : tab.id === 'ai'
                        ? 'border border-orange-500/30 text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 hover:scale-105'
                        : isDark
                        ? 'text-stone-400 hover:text-white hover:bg-stone-800/70 hover:scale-105'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-orange-100/60 hover:scale-105'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {isActive && (
                      <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                    )}
                  </button>

                  {/* Clean Tooltip on Hover */}
                  <div className="absolute top-full mt-2.5 hidden group-hover:flex flex-col items-center pointer-events-none z-50 animate-fadeIn">
                    <div className="w-2 h-2 bg-stone-900 rotate-45 -mb-1 border-t border-l border-stone-700/80" />
                    <span className="px-3 py-1.5 text-xs font-bold tracking-tight rounded-xl bg-stone-900 text-stone-100 border border-stone-700/80 shadow-2xl whitespace-nowrap">
                      {tab.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Right Action Tools: Database Status, Cart, Dark Mode, Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Firebase Live Cloud Status Indicator */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border ${
                isFirebaseConnected
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              }`}
              title={isFirebaseConnected ? 'Firebase Cloud Database Active & Connected' : 'Connecting to Cloud...'}
            >
              <span className={`w-2 h-2 rounded-full ${isFirebaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="hidden lg:inline">{isFirebaseConnected ? 'Cloud DB' : 'Connecting'}</span>
            </div>

            {/* Shopping Bag Button */}
            <button
              onClick={onOpenCart}
              className="relative p-2.5 rounded-xl border border-orange-500/25 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 transition-colors cursor-pointer"
              title="Shopping Cart"
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
                isGuest
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white border-orange-500 shadow-md'
                  : roleLabels[currentUser.role].color
              }`}
              title={isGuest ? 'Sign In or Register' : `${currentUser.name} (${currentUser.role})`}
            >
              <UserCheck className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{isGuest ? 'Sign In' : currentUser.name.split(' ')[0]}</span>
              {!isGuest && (
                <span className="text-[10px] uppercase tracking-wide opacity-80">({currentUser.role})</span>
              )}
            </button>

            {/* Clear All Records / Reset Data (For Owner) */}
            {currentUser.role === 'owner' && (
              <button
                onClick={() => setShowResetModal(true)}
                className="p-2.5 rounded-xl text-stone-500 hover:text-rose-400 hover:bg-stone-800/40 transition-colors cursor-pointer"
                title="Wipe All Records to 0 (Fresh Start for Real World Use)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Confirmation Modal to Wipe Database and Local Records to 0 */}
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div
              className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl ${
                isDark ? 'bg-stone-900 border-rose-500/30 text-stone-100' : 'bg-white border-rose-200 text-stone-900'
              }`}
            >
              <div className="flex items-center gap-3 text-rose-500 mb-3">
                <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg">Reset All Data to 0?</h3>
                  <p className="text-xs text-stone-400">Fresh Clean Slate for Real-World Operation</p>
                </div>
              </div>
              <p className="text-xs text-stone-300 mb-5 leading-relaxed">
                This will purge all recorded inventory (bales, products), online customer orders, operating expenses, and cashflow transactions from the cloud database and local memory. Your Owner and Staff logins will be preserved.
              </p>
              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setShowResetModal(false);
                    await resetAllData();
                    setResetNotice(true);
                    setTimeout(() => setResetNotice(false), 4000);
                  }}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/40 cursor-pointer"
                >
                  Yes, Wipe All Data to 0
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reset Feedback Notification Toast */}
        {resetNotice && (
          <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs shadow-2xl flex items-center gap-3 animate-fadeIn">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold">Database & cache successfully wiped to 0. System is ready for live use!</span>
          </div>
        )}

        {/* Mobile Navigation bar: Icon only with tooltip */}
        <div className="md:hidden flex items-center justify-around gap-1 overflow-x-auto pb-3 pt-1 border-t border-orange-500/10">
          {navLinks.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <div key={tab.id} className="relative group flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  aria-label={tab.label}
                  className={`p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-orange-600 text-white shadow-md'
                      : isDark
                      ? 'text-stone-400 hover:bg-stone-800'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </button>
                <div className="absolute bottom-full mb-1.5 hidden group-hover:flex flex-col items-center pointer-events-none z-50">
                  <span className="px-2 py-1 text-[10px] font-bold rounded-lg bg-stone-900 text-stone-200 border border-stone-700 shadow-lg whitespace-nowrap">
                    {tab.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </header>
  );
};
