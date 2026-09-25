import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { X, Lock, Mail, Shield, CheckCircle2, AlertCircle, LogOut, User as UserIcon } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    isDark,
    signInWithEmail,
    signUpWithEmail,
    signOutCurrentUser,
    authError,
    clearAuthError,
    isFirebaseConnected,
  } = useStore();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localFeedback, setLocalFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const isGuest = currentUser.id === 'user-guest' || currentUser.id === 'guest' || !currentUser.email;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLocalFeedback(null);
    clearAuthError();

    if (mode === 'signup') {
      const res = await signUpWithEmail(email, password, name, phone, address);
      setIsLoading(false);
      if (res.success) {
        setLocalFeedback('Customer account registered successfully!');
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } else {
      const res = await signInWithEmail(email, password);
      setIsLoading(false);
      if (res.success) {
        const roleMsg =
          res.targetRole === 'owner'
            ? 'Logged in as Admin (Owner) — Opening Dashboard!'
            : res.targetRole === 'staff'
            ? 'Logged in as Staff Member — Opening POS!'
            : 'Signed in successfully as Customer!';
        setLocalFeedback(roleMsg);
        setTimeout(() => {
          onClose();
        }, 800);
      }
    }
  };

  const handleSignOut = async () => {
    await signOutCurrentUser();
    setLocalFeedback('You have signed out.');
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div
        className={`w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden transition-all ${
          isDark
            ? 'bg-stone-900 border-orange-500/30 text-stone-100'
            : 'bg-white border-orange-200 text-stone-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-orange-500/20 bg-gradient-to-r from-orange-600/20 to-amber-600/20">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-500" />
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">
                {mode === 'login' ? 'Sign In to EXINS' : 'Register Customer Account'}
              </h3>
              <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
                <span className={`w-2 h-2 rounded-full ${isFirebaseConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span>{isFirebaseConnected ? 'Firebase Cloud Active' : 'Connecting to Cloud...'}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-500/20 text-stone-400 hover:text-stone-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
          {/* Active User Status Banner */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between ${
              isDark ? 'bg-stone-800/80 border-stone-700' : 'bg-orange-50 border-orange-200'
            }`}
          >
            <div className="text-xs">
              <span className="text-stone-400">Current Status: </span>
              {isGuest ? (
                <span className="font-semibold text-stone-300">Guest Visitor</span>
              ) : (
                <>
                  <strong className="text-orange-400">{currentUser.name}</strong>
                  <span
                    className={`text-[10px] uppercase px-1.5 py-0.5 rounded font-bold ml-1.5 border ${
                      currentUser.role === 'owner'
                        ? 'bg-red-500/20 text-red-300 border-red-500/30'
                        : currentUser.role === 'staff'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {currentUser.role}
                  </span>
                </>
              )}
            </div>
            {!isGuest && (
              <button
                onClick={handleSignOut}
                className="text-xs flex items-center gap-1 text-red-400 hover:text-red-300 font-semibold px-2 py-1 rounded-lg hover:bg-red-500/10 cursor-pointer transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            )}
          </div>

          {/* Mode Switch Tabs: Sign In / Customer Sign Up */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-stone-800/60 border border-stone-700/60">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                clearAuthError();
              }}
              className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                clearAuthError();
              }}
              className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Customer Sign Up
            </button>
          </div>

          {/* Error / Success Feedback */}
          {authError && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{authError}</span>
            </div>
          )}

          {localFeedback && (
            <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{localFeedback}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">Customer Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maria Santos"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full pl-10 pr-3.5 py-2 rounded-xl border text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none ${
                      isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                {mode === 'login' ? 'Email Address' : 'Customer Email Address'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder={mode === 'login' ? 'e.g. email@example.com' : 'e.g. customer@gmail.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-3.5 py-2 rounded-xl border text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none ${
                    isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-300 text-stone-900'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-2.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-10 pr-3.5 py-2 rounded-xl border text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none ${
                    isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-300 text-stone-900'
                  }`}
                />
              </div>
            </div>

            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">Contact Phone (Optional)</label>
                  <input
                    type="tel"
                    placeholder="+63 917 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none ${
                      isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">Delivery Address (Optional)</label>
                  <input
                    type="text"
                    placeholder="Brgy. San Bartolome, Novaliches, Quezon City"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none ${
                      isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-orange-950/30 transition-all cursor-pointer mt-3 disabled:opacity-50"
            >
              {isLoading
                ? 'Verifying...'
                : mode === 'login'
                ? 'Sign In'
                : 'Complete Customer Registration'}
            </button>
          </form>

          {/* Helper note */}
          <div className="text-center text-[11px] text-stone-400 pt-2 border-t border-stone-800/60">
            {mode === 'login' ? (
              <p>
                Signing in with designated staff or owner credentials will automatically open staff or admin tools.
              </p>
            ) : (
              <p>
                Only customers can create new accounts. Staff and administrator accounts are managed by store ownership.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
