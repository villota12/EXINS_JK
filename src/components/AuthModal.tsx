import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { UserRole, User } from '../types';
import { initialUsers } from '../data/initialData';
import { X, Lock, Mail, Shield, Sparkles, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    setCurrentUser,
    isDark,
    setActiveTab,
    signInWithEmail,
    signUpWithEmail,
    signOutCurrentUser,
    authError,
    clearAuthError,
    isFirebaseConnected,
    firebaseUser,
  } = useStore();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [role, setRole] = useState<UserRole>('customer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localFeedback, setLocalFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleQuickLogin = (demoUser: User) => {
    setCurrentUser(demoUser);
    if (demoUser.role === 'customer') {
      setActiveTab('shop');
    } else if (demoUser.role === 'staff') {
      setActiveTab('pos');
    } else {
      setActiveTab('dashboard');
    }
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLocalFeedback(null);
    clearAuthError();

    if (mode === 'signup') {
      const res = await signUpWithEmail(email, password, name, role, phone, address);
      setIsLoading(false);
      if (res.success) {
        setLocalFeedback('Account successfully registered with Firebase!');
        setTimeout(() => {
          if (role === 'customer') {
            setActiveTab('shop');
          } else if (role === 'staff') {
            setActiveTab('pos');
          } else {
            setActiveTab('dashboard');
          }
          onClose();
        }, 800);
      }
    } else {
      const res = await signInWithEmail(email, password);
      setIsLoading(false);
      if (res.success) {
        setLocalFeedback('Signed in successfully!');
        setTimeout(() => {
          onClose();
        }, 800);
      }
    }
  };

  const handleSignOut = async () => {
    await signOutCurrentUser();
    onClose();
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
                {mode === 'login' ? 'Sign In to EXINS' : 'Create EXINS Account'}
              </h3>
              <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
                <span className={`w-2 h-2 rounded-full ${isFirebaseConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                <span>{isFirebaseConnected ? 'Firebase Auth & Cloud Active' : 'Connecting Firebase...'}</span>
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
          <div className={`p-3 rounded-xl border flex items-center justify-between ${
            isDark ? 'bg-stone-800/80 border-stone-700' : 'bg-orange-50 border-orange-200'
          }`}>
            <div className="text-xs">
              <span className="text-stone-400">Active Profile: </span>
              <strong className="text-orange-400">{currentUser.name}</strong>{' '}
              <span className="text-[11px] uppercase px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 font-bold ml-1">
                {currentUser.role}
              </span>
            </div>
            {firebaseUser && (
              <button
                onClick={handleSignOut}
                className="text-xs flex items-center gap-1 text-red-400 hover:text-red-300 font-medium cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            )}
          </div>

          {/* Quick Demo Login Preset Buttons */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-orange-400 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>One-Click Demo Profiles:</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {initialUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleQuickLogin(u)}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    currentUser.email === u.email
                      ? 'border-orange-500 bg-orange-500/20 font-bold'
                      : isDark
                      ? 'border-stone-800 bg-stone-800/60 hover:border-orange-500/50'
                      : 'border-stone-200 bg-stone-50 hover:border-orange-300'
                  }`}
                >
                  <div className="text-xs font-bold capitalize text-orange-500">{u.role}</div>
                  <div className="text-[10px] text-stone-400 truncate">{u.name.split(' ')[0]}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-stone-700/50"></div>
            <span className="flex-shrink mx-3 text-stone-400 text-[10px] uppercase tracking-wider font-semibold">
              Or Firebase Email Authentication
            </span>
            <div className="flex-grow border-t border-stone-700/50"></div>
          </div>

          {/* Error / Success Feedback */}
          {authError && (
            <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span className="capitalize">{authError}</span>
            </div>
          )}

          {localFeedback && (
            <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{localFeedback}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Role Selector (visible during signup) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">Select Account Role:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['owner', 'staff', 'customer'] as UserRole[]).map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setRole(r)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold capitalize border transition-all cursor-pointer ${
                        role === r
                          ? 'bg-orange-600 text-white border-orange-500 shadow-md'
                          : isDark
                          ? 'border-stone-800 bg-stone-800 text-stone-400'
                          : 'border-stone-200 bg-stone-100 text-stone-600'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Frank Edward Villota"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none ${
                    isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-300 text-stone-900'
                  }`}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="e.g. user@exins.ph"
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
                  <label className="block text-xs font-semibold text-stone-300 mb-1">Contact Number (Optional)</label>
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
                    placeholder="Novaliches, Quezon City"
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
              {isLoading ? 'Processing with Firebase...' : mode === 'login' ? 'Sign In with Firebase' : 'Register Firebase Account'}
            </button>
          </form>

          {/* Toggle login / signup */}
          <div className="text-center text-xs text-stone-400 pt-1">
            {mode === 'login' ? (
              <span>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    clearAuthError();
                  }}
                  className="font-bold text-orange-400 hover:underline cursor-pointer"
                >
                  Sign Up Here
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    clearAuthError();
                  }}
                  className="font-bold text-orange-400 hover:underline cursor-pointer"
                >
                  Log In Here
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
