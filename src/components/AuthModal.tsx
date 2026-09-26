import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { User } from '../types';
import { X, Lock, Mail, Shield, CheckCircle2, AlertCircle, LogOut, User as UserIcon, Phone, MapPin } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    isDark,
    signInWithEmail,
    signInWithGoogle,
    completeGoogleSignUp,
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

  // Google Sign-Up additional required profile info step
  const [googleNeedsDetails, setGoogleNeedsDetails] = useState(false);
  const [googleTempUser, setGoogleTempUser] = useState<Partial<User> | null>(null);
  const [googleName, setGoogleName] = useState('');
  const [googlePhone, setGooglePhone] = useState('');
  const [googleAddress, setGoogleAddress] = useState('');

  if (!isOpen) return null;

  const isGuest = !currentUser.email || currentUser.id === 'user-guest' || currentUser.id === 'guest';

  // Email & Password Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLocalFeedback(null);
    clearAuthError();

    if (mode === 'signup') {
      if (!name.trim() || !email.trim() || !password.trim() || !phone.trim() || !address.trim()) {
        setIsLoading(false);
        setLocalFeedback(null);
        return;
      }

      const res = await signUpWithEmail(email, password, name, phone, address);
      setIsLoading(false);
      if (res.success) {
        setLocalFeedback('Customer account registered successfully! You can now shop.');
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } else {
      const res = await signInWithEmail(email, password);
      setIsLoading(false);
      if (res.success) {
        const roleMsg =
          res.targetRole === 'owner'
            ? 'Logged in as Store Owner — Opening Executive Dashboard!'
            : res.targetRole === 'staff'
            ? 'Logged in as Staff Member — Opening POS Counter!'
            : 'Signed in successfully as Customer! Ready to shop.';
        setLocalFeedback(roleMsg);
        setTimeout(() => {
          onClose();
        }, 900);
      }
    }
  };

  // Google Sign-In / Sign-Up
  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setLocalFeedback(null);
    clearAuthError();

    const res = await signInWithGoogle();
    setIsLoading(false);

    if (res.success) {
      if (res.needsDetails && res.tempUser) {
        // Customer needs to complete required profile: Full Name, Phone, and Delivery Address
        setGoogleTempUser(res.tempUser);
        setGoogleName(res.tempUser.name || '');
        setGooglePhone(res.tempUser.phone || '');
        setGoogleAddress(res.tempUser.address || '');
        setGoogleNeedsDetails(true);
      } else {
        const roleMsg =
          res.targetRole === 'owner'
            ? 'Welcome back Owner! Opening Dashboard...'
            : res.targetRole === 'staff'
            ? 'Welcome back Staff! Opening POS...'
            : 'Signed in with Google successfully!';
        setLocalFeedback(roleMsg);
        setTimeout(() => {
          onClose();
        }, 800);
      }
    }
  };

  // Complete Google Signup Step
  const handleCompleteGoogleDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleTempUser) return;
    setIsLoading(true);
    setLocalFeedback(null);
    clearAuthError();

    const res = await completeGoogleSignUp({
      name: googleName,
      phone: googlePhone,
      address: googleAddress,
      tempUser: googleTempUser,
    });
    setIsLoading(false);

    if (res.success) {
      setLocalFeedback('Google Customer Account registered successfully!');
      setTimeout(() => {
        onClose();
      }, 900);
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
        className={`w-full max-w-md rounded-3xl shadow-2xl border overflow-hidden transition-all ${
          isDark
            ? 'bg-stone-900 border-orange-500/30 text-stone-100'
            : 'bg-white border-orange-200 text-stone-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-orange-500/20 bg-gradient-to-r from-orange-600/20 to-amber-600/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">
                {googleNeedsDetails
                  ? 'Complete Customer Registration'
                  : mode === 'login'
                  ? 'Sign In to EXINS'
                  : 'Customer Sign Up'}
              </h3>
              <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
                <span className={`w-2 h-2 rounded-full ${isFirebaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span>{isFirebaseConnected ? 'Firebase Cloud Database Active' : 'Connecting to Cloud...'}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-stone-500/20 text-stone-400 hover:text-stone-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
          {/* Active User Status Banner */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between ${
              isDark ? 'bg-stone-800/80 border-stone-700' : 'bg-orange-50 border-orange-200'
            }`}
          >
            <div className="text-xs">
              <span className="text-stone-400">Current Role: </span>
              {isGuest ? (
                <span className="font-semibold text-stone-300">Guest Shopper</span>
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
                className="text-xs flex items-center gap-1 text-red-400 hover:text-red-300 font-semibold px-2.5 py-1 rounded-lg hover:bg-red-500/10 cursor-pointer transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            )}
          </div>

          {/* Feedback messages */}
          {authError && (
            <div className="p-3.5 rounded-2xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{authError}</span>
            </div>
          )}

          {localFeedback && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{localFeedback}</span>
            </div>
          )}

          {/* ================= FLOW 1: GOOGLE SIGN-UP REQUIRED PROFILE COMPLETION ================= */}
          {googleNeedsDetails ? (
            <form onSubmit={handleCompleteGoogleDetails} className="space-y-3.5">
              <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-300">
                <p className="font-bold">Welcome, {googleTempUser?.name || 'Customer'}!</p>
                <p className="text-[11px] text-stone-300 mt-0.5">
                  Google account linked ({googleTempUser?.email}). Please provide your full name, contact phone, and delivery address to start adding items to cart.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maria Santos"
                    value={googleName}
                    onChange={(e) => setGoogleName(e.target.value)}
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none ${
                      isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Contact Phone <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-2.5" />
                  <input
                    type="tel"
                    required
                    placeholder="+63 917 123 4567"
                    value={googlePhone}
                    onChange={(e) => setGooglePhone(e.target.value)}
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none ${
                      isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Delivery Address <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-stone-400 absolute left-3.5 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="Brgy. San Bartolome, Novaliches, Quezon City"
                    value={googleAddress}
                    onChange={(e) => setGoogleAddress(e.target.value)}
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none ${
                      isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-orange-950/30 transition-all cursor-pointer mt-2 disabled:opacity-50"
              >
                {isLoading ? 'Saving Account...' : 'Complete Account & Start Shopping'}
              </button>

              <button
                type="button"
                onClick={() => setGoogleNeedsDetails(false)}
                className="w-full text-center text-xs text-stone-400 hover:text-white pt-1 cursor-pointer"
              >
                Back to Sign In
              </button>
            </form>
          ) : (
            /* ================= FLOW 2: STANDARD SIGN IN & SIGN UP ONLY ================= */
            <>
              {/* Only Sign In and Sign Up Tabs */}
              <div className="grid grid-cols-2 p-1 rounded-2xl bg-stone-800/60 border border-stone-700/60">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    clearAuthError();
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
                  className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    mode === 'signup'
                      ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Fast Google Authentication Button */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className={`w-full py-2.5 px-4 rounded-xl border flex items-center justify-center gap-3 text-xs font-bold transition-all cursor-pointer ${
                  isDark
                    ? 'bg-stone-800/90 border-stone-700 text-stone-100 hover:bg-stone-700/80 shadow-md'
                    : 'bg-white border-stone-300 text-stone-800 hover:bg-stone-50 shadow-sm'
                }`}
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{mode === 'signup' ? 'Fast Sign Up with Google' : 'Continue with Google'}</span>
              </button>

              <div className="relative flex items-center justify-center my-1">
                <div className="border-t border-stone-800 w-full" />
                <span className="bg-stone-900 px-3 text-[11px] text-stone-500 uppercase tracking-wider font-semibold">
                  Or use email
                </span>
                <div className="border-t border-stone-800 w-full" />
              </div>

              {/* Email Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      Customer Full Name <span className="text-rose-400">*</span>
                    </label>
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
                    Email Address <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-2.5" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. customer@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full pl-10 pr-3.5 py-2 rounded-xl border text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none ${
                        isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-300 text-stone-900'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Password <span className="text-rose-400">*</span>
                  </label>
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
                      <label className="block text-xs font-semibold text-stone-300 mb-1">
                        Contact Phone <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-2.5" />
                        <input
                          type="tel"
                          required
                          placeholder="+63 917 123 4567"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className={`w-full pl-10 pr-3.5 py-2 rounded-xl border text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none ${
                            isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-300 text-stone-900'
                          }`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-300 mb-1">
                        Delivery Address <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-stone-400 absolute left-3.5 top-2.5" />
                        <input
                          type="text"
                          required
                          placeholder="Brgy. San Bartolome, Novaliches, Quezon City"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className={`w-full pl-10 pr-3.5 py-2 rounded-xl border text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none ${
                            isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-300 text-stone-900'
                          }`}
                        />
                      </div>
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

              <div className="text-center text-[11px] text-stone-400 pt-2 border-t border-stone-800/60">
                {mode === 'login' ? (
                  <p>
                    Sign in with owner, staff, or customer credentials to access your store features.
                  </p>
                ) : (
                  <p>
                    All customer fields (Full Name, Contact Phone, and Delivery Address) are required.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
