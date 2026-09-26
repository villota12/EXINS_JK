import React, { useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { ShowcaseShop } from './components/ShowcaseShop';
import { InventoryManagement } from './components/InventoryManagement';
import { FinanceManagement } from './components/FinanceManagement';
import { Forecasting } from './components/Forecasting';
import { POS } from './components/POS';
import { ReceiptModal } from './components/ReceiptModal';
import { AIExinsWidget } from './components/AIExinsWidget';
import { AuthModal } from './components/AuthModal';
import { Shield } from 'lucide-react';

const BACKGROUND_IMAGE_URL =
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1920&q=80';

function MainApp() {
  const { activeTab, isDark, currentUser, setSelectedReceipt } = useStore();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCartBagOpen, setIsCartBagOpen] = useState(false);

  return (
    <div
      className={`min-h-screen relative font-sans transition-colors duration-300 ${
        isDark ? 'text-stone-100' : 'text-stone-900'
      }`}
      style={{
        backgroundImage: `url(${BACKGROUND_IMAGE_URL})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Warm Brown & Orange Glassmorphism Dark/Light Backdrop Overlay */}
      <div
        className={`min-h-screen transition-colors duration-300 ${
          isDark
            ? 'bg-gradient-to-b from-[#1c120c]/65 via-[#26150e]/55 to-[#160c07]/68'
            : 'bg-gradient-to-b from-[#fff7ed]/68 via-[#ffedd5]/55 to-[#fed7aa]/65'
        } flex flex-col`}
      >
        {/* Navigation Bar */}
        <Navbar
          onOpenCart={() => setIsCartBagOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
        />

        {/* Main Content View Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'dashboard' && currentUser.role === 'owner' && <Dashboard />}

          {activeTab === 'shop' && (
            <ShowcaseShop
              onOpenReceipt={(receipt) => setSelectedReceipt(receipt)}
              onOpenAuth={() => setIsAuthOpen(true)}
            />
          )}

          {activeTab === 'inventory' &&
            (currentUser.role === 'owner' || currentUser.role === 'staff') && (
              <InventoryManagement />
            )}

          {activeTab === 'finance' && currentUser.role === 'owner' && <FinanceManagement />}

          {activeTab === 'forecasting' && currentUser.role === 'owner' && <Forecasting />}

          {activeTab === 'pos' &&
            (currentUser.role === 'owner' || currentUser.role === 'staff') && (
              <POS onOpenReceipt={(receipt) => setSelectedReceipt(receipt)} />
            )}

          {activeTab === 'ai' && currentUser.role === 'owner' && <AIExinsWidget />}

          {/* Guard for unauthorized tab access */}
          {((currentUser.role === 'customer' && activeTab !== 'shop') ||
            (currentUser.role === 'staff' &&
              (activeTab === 'dashboard' || activeTab === 'finance' || activeTab === 'forecasting' || activeTab === 'ai'))) && (
            <div className="text-center py-20 p-8 rounded-3xl border border-stone-800 bg-stone-900/80 backdrop-blur-xl max-w-lg mx-auto">
              <Shield className="w-12 h-12 text-orange-500 mx-auto mb-3" />
              <h2 className="text-xl font-bold">Access Restricted</h2>
              <p className="text-xs text-stone-400 mt-2">
                Your current role is <strong className="text-orange-400 capitalize">{currentUser.role}</strong>.
                Sign in with the <strong className="text-white">Owner</strong> account to access dashboard, finance, and forecasting modules.
              </p>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer
          className={`no-print border-t py-6 mt-12 transition-colors ${
            isDark
              ? 'bg-stone-950/80 border-orange-500/20 text-stone-400'
              : 'bg-white/80 border-orange-200 text-stone-600'
          } backdrop-blur-xl`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-black text-orange-500 text-sm">EXINS Jksur+</span>
              <span>— Novaliches, Quezon City, Metro Manila</span>
            </div>
            <div className="text-center italic">
              “Your Next Favorite Outfit is Hiding Here.”
            </div>
            <div className="text-[11px] text-stone-500">
              Inventory & EWMA Sales Forecasting System
            </div>
          </div>
        </footer>
      </div>

      {/* Global Modals */}
      <ReceiptModal />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <MainApp />
    </StoreProvider>
  );
}
