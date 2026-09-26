import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  UserRole,
  Category,
  Supplier,
  Bale,
  Product,
  CartItem,
  Order,
  OrderStatus,
  ExpenseAccount,
  Expense,
  Transaction,
  TransactionStats,
  PaymentMethod,
} from '../types';
import {
  initialCategories,
  initialSuppliers,
  initialBales,
  initialProducts,
  initialOrders,
  initialExpenseAccounts,
  initialExpenses,
  initialTransactions,
  initialTransactionStats,
  initialUsers,
} from '../data/initialData';
import {
  auth,
  db,
  doc,
  getDocFromServer,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  checkFirestoreConnection,
  FirebaseUser,
} from '../firebase/config';
import {
  COLLECTIONS,
  saveDocument,
  removeDocument,
  subscribeToCollection,
  seedCollectionIfEmpty,
  syncUserProfile,
  clearAllInventoryAndFinancialRecords,
} from '../firebase/dbService';

export const ADMIN_EMAIL = 'villotafrankedward@gmail.com';
export const ADMIN_PASS = '12345678';
export const STAFF_EMAIL = 'frankvillota905@gmail.com';
export const STAFF_EMAIL_TYPO = 'frankvillota905@gmail.copm';
export const STAFF_PASS = '12345678';

interface StoreContextType {
  // User & Auth
  currentUser: User;
  setCurrentUser: (user: User) => void;
  switchRole: (role: UserRole) => void;
  isDark: boolean;
  toggleTheme: () => void;
  isFirebaseConnected: boolean;
  firebaseUser: FirebaseUser | null;
  authError: string | null;
  clearAuthError: () => void;
  signInWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string; targetRole?: UserRole }>;
  signInWithGoogle: () => Promise<{
    success: boolean;
    error?: string;
    targetRole?: UserRole;
    needsDetails?: boolean;
    tempUser?: Partial<User>;
  }>;
  completeGoogleSignUp: (params: {
    name: string;
    phone: string;
    address: string;
    tempUser: Partial<User>;
  }) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (
    email: string,
    pass: string,
    name: string,
    phone: string,
    address: string
  ) => Promise<{ success: boolean; error?: string }>;
  signOutCurrentUser: () => Promise<void>;

  // Navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;
  shopView: 'browse' | 'orders';
  setShopView: (view: 'browse' | 'orders') => void;
  inventoryTab: 'suppliers' | 'categories' | 'bales' | 'products';
  setInventoryTab: (tab: 'suppliers' | 'categories' | 'bales' | 'products') => void;
  financeTab: 'accounts' | 'record' | 'history';
  setFinanceTab: (tab: 'accounts' | 'record' | 'history') => void;
  forecastingTab: 'ewma' | 'top_spenders' | 'stats';
  setForecastingTab: (tab: 'ewma' | 'top_spenders' | 'stats') => void;

  // Data Collections
  categories: Category[];
  addCategory: (category: Omit<Category, 'id' | 'inStock'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'totalBalesSourced'>) => void;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  bales: Bale[];
  addBale: (bale: Omit<Bale, 'id' | 'pricePerPiece' | 'totalSales'>) => void;
  updateBale: (id: string, bale: Partial<Bale>) => void;
  updateBaleStatus: (id: string, status: 'sealed' | 'opened' | 'depleted') => void;
  deleteBale: (id: string) => void;

  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'barcode' | 'dateAdded'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Cart & Checkout
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => { success: boolean; message: string };
  updateCartQty: (productId: string, delta: number) => { success: boolean; message?: string };
  removeFromCart: (productId: string) => void;
  clearCart: () => void;

  // Orders
  orders: Order[];
  createOrder: (orderData: Omit<Order, 'id' | 'orderNumber' | 'status' | 'orderDate'>) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  cancelOrder: (orderId: string) => void;

  // Finance
  expenseAccounts: ExpenseAccount[];
  addExpenseAccount: (account: Omit<ExpenseAccount, 'id' | 'totalSpent'>) => void;
  updateExpenseAccount: (id: string, account: Partial<ExpenseAccount>) => void;
  deleteExpenseAccount: (id: string) => void;
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, tx: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  // Inventory transaction stats
  transactionStats: TransactionStats;

  // POS Sale Confirmation
  processPosSale: (params: {
    customerName?: string;
    items: CartItem[];
    subtotal: number;
    discount: number;
    totalDue: number;
    paymentMethod: PaymentMethod;
    amountTendered: number;
    change: number;
  }) => { success: boolean; receiptData: any };

  // Utilities
  resetAllData: () => void;
  selectedReceipt: any | null;
  setSelectedReceipt: (receipt: any | null) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEY = 'exins_empty_prod_v4';

// Aggressive one-time purge of ANY old mock data from previous builds/sessions
try {
  const versionKey = 'exins_data_version';
  const currentVer = typeof window !== 'undefined' ? localStorage.getItem(versionKey) : null;
  if (currentVer !== 'v4_pure_empty_production') {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('exins_') && k !== 'exins_theme') {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    localStorage.setItem(versionKey, 'v4_pure_empty_production');
  }
} catch (e) {
  console.warn('LocalStorage reset note:', e);
}

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('exins_theme');
    return saved !== null ? saved === 'dark' : true;
  });

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem('exins_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  // Auth & Roles: ALWAYS start as Guest Shopper when opening the system link
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'guest',
    name: 'Guest Shopper',
    email: '',
    role: 'customer',
  });
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = () => setAuthError(null);

  // Navigation tabs: Defaults to 'shop' (Showcase Shop) for guest shoppers
  const [activeTab, setActiveTab] = useState<string>('shop');
  const [shopView, setShopView] = useState<'browse' | 'orders'>('browse');

  // Inventory tab order: Bale Supplier, Product Categories, Bale Management, Product List
  const [inventoryTab, setInventoryTab] = useState<'suppliers' | 'categories' | 'bales' | 'products'>('suppliers');
  const [financeTab, setFinanceTab] = useState<'accounts' | 'record' | 'history'>('accounts');
  const [forecastingTab, setForecastingTab] = useState<'ewma' | 'top_spenders' | 'stats'>('ewma');

  // Printable receipt modal state
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  // Entities state - Clean and initialized with zero recorded inventory/expenses for production
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_categories`);
    return saved ? JSON.parse(saved) : initialCategories;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_suppliers`);
    return saved ? JSON.parse(saved) : initialSuppliers;
  });

  const [bales, setBales] = useState<Bale[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_bales`);
    return saved ? JSON.parse(saved) : initialBales;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_products`);
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_orders`);
    return saved ? JSON.parse(saved) : initialOrders;
  });

  const [expenseAccounts, setExpenseAccounts] = useState<ExpenseAccount[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_expenseAccounts`);
    return saved ? JSON.parse(saved) : initialExpenseAccounts;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_expenses`);
    return saved ? JSON.parse(saved) : initialExpenses;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_transactions`);
    return saved ? JSON.parse(saved) : initialTransactions;
  });

  const [transactionStats, setTransactionStats] = useState<TransactionStats>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_transactionStats`);
    return saved ? JSON.parse(saved) : initialTransactionStats;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_cart`);
    return saved ? JSON.parse(saved) : [];
  });

  // 1. Firebase Initialization & Live Synchronisation
  useEffect(() => {
    let isMounted = true;

    // Verify Firestore connection
    checkFirestoreConnection()
      .then((connected) => {
        if (isMounted) setIsFirebaseConnected(connected);
      })
      .catch(() => {
        if (isMounted) setIsFirebaseConnected(false);
      });

    // Check if initial production clean was performed
    const hasPurgedOldData = localStorage.getItem('exins_production_clean_v3');
    if (!hasPurgedOldData) {
      // Clear legacy dummy data from Firestore and local storage
      clearAllInventoryAndFinancialRecords().catch((err) =>
        console.warn('Initial cleanup notice:', err)
      );
      localStorage.setItem('exins_production_clean_v3', 'true');
    }

    // Listen to Firebase Auth state
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!isMounted) return;
      setFirebaseUser(user);
      if (user && user.email) {
        setIsFirebaseConnected(true);
        const normalized = user.email.toLowerCase();
        const isAdmin = normalized === ADMIN_EMAIL.toLowerCase();
        const isStaff =
          normalized === STAFF_EMAIL.toLowerCase() ||
          normalized === STAFF_EMAIL_TYPO.toLowerCase();

        const detectedRole: UserRole = isAdmin ? 'owner' : isStaff ? 'staff' : 'customer';
        const displayName =
          detectedRole === 'owner'
            ? 'Frank Edward (Owner)'
            : detectedRole === 'staff'
            ? 'Frank Villota (Staff)'
            : user.displayName || normalized.split('@')[0];

        setCurrentUser({
          id: user.uid,
          name: displayName,
          email: user.email,
          role: detectedRole,
        });
      }
    });

    // Real-time Firestore Listeners - ensures all users and devices see database updates live
    const unsubCategories = subscribeToCollection<Category>(COLLECTIONS.CATEGORIES, (items) => {
      if (isMounted) setCategories(items);
    });

    const unsubSuppliers = subscribeToCollection<Supplier>(COLLECTIONS.SUPPLIERS, (items) => {
      if (isMounted) setSuppliers(items);
    });

    const unsubBales = subscribeToCollection<Bale>(COLLECTIONS.BALES, (items) => {
      if (isMounted) setBales(items);
    });

    const unsubProducts = subscribeToCollection<Product>(COLLECTIONS.PRODUCTS, (items) => {
      if (isMounted) setProducts(items);
    });

    const unsubOrders = subscribeToCollection<Order>(COLLECTIONS.ORDERS, (items) => {
      if (isMounted) setOrders(items);
    });

    const unsubAccounts = subscribeToCollection<ExpenseAccount>(COLLECTIONS.EXPENSE_ACCOUNTS, (items) => {
      if (isMounted) setExpenseAccounts(items);
    });

    const unsubExpenses = subscribeToCollection<Expense>(COLLECTIONS.EXPENSES, (items) => {
      if (isMounted) setExpenses(items);
    });

    const unsubTxs = subscribeToCollection<Transaction>(COLLECTIONS.TRANSACTIONS, (items) => {
      if (isMounted) setTransactions(items);
    });

    return () => {
      isMounted = false;
      unsubscribeAuth();
      unsubCategories();
      unsubSuppliers();
      unsubBales();
      unsubProducts();
      unsubOrders();
      unsubAccounts();
      unsubExpenses();
      unsubTxs();
    };
  }, []);

  // Calculate live category stock dynamically
  const categoriesWithStock = categories.map((cat) => {
    const inStock = products
      .filter((p) => p.categoryId === cat.id)
      .reduce((sum, p) => sum + p.quantity, 0);
    return { ...cat, inStock };
  });

  // Auto-sync to localStorage as resilient client-side backup
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_categories`, JSON.stringify(categories));
    localStorage.setItem(`${STORAGE_KEY}_suppliers`, JSON.stringify(suppliers));
    localStorage.setItem(`${STORAGE_KEY}_bales`, JSON.stringify(bales));
    localStorage.setItem(`${STORAGE_KEY}_products`, JSON.stringify(products));
    localStorage.setItem(`${STORAGE_KEY}_orders`, JSON.stringify(orders));
    localStorage.setItem(`${STORAGE_KEY}_expenseAccounts`, JSON.stringify(expenseAccounts));
    localStorage.setItem(`${STORAGE_KEY}_expenses`, JSON.stringify(expenses));
    localStorage.setItem(`${STORAGE_KEY}_transactions`, JSON.stringify(transactions));
    localStorage.setItem(`${STORAGE_KEY}_transactionStats`, JSON.stringify(transactionStats));
    localStorage.setItem(`${STORAGE_KEY}_cart`, JSON.stringify(cart));
  }, [categories, suppliers, bales, products, orders, expenseAccounts, expenses, transactions, transactionStats, cart]);

  // Firebase Authentication Handlers
  const signInWithEmail = async (
    email: string,
    pass: string
  ): Promise<{ success: boolean; error?: string; targetRole?: UserRole }> => {
    try {
      setAuthError(null);
      const normalizedEmail = email.trim().toLowerCase();
      const isAdmin = normalizedEmail === ADMIN_EMAIL.toLowerCase();
      const isStaff =
        normalizedEmail === STAFF_EMAIL.toLowerCase() ||
        normalizedEmail === STAFF_EMAIL_TYPO.toLowerCase();

      // Check designated passwords
      if (isAdmin && pass !== ADMIN_PASS) {
        const msg = 'Incorrect password for Owner account.';
        setAuthError(msg);
        return { success: false, error: msg };
      }
      if (isStaff && pass !== STAFF_PASS) {
        const msg = 'Incorrect password for Staff account.';
        setAuthError(msg);
        return { success: false, error: msg };
      }

      const detectedRole: UserRole = isAdmin ? 'owner' : isStaff ? 'staff' : 'customer';
      let userDisplayName = isAdmin
        ? 'Frank Edward (Owner)'
        : isStaff
        ? 'Frank Villota (Staff)'
        : normalizedEmail.split('@')[0];
      let userId = isAdmin ? 'user-owner' : isStaff ? 'user-staff' : `user-${Date.now()}`;

      // Firebase Authentication flow
      try {
        const userCred = await signInWithEmailAndPassword(auth, normalizedEmail, pass);
        const user = userCred.user;
        userId = user.uid;
        if (user.displayName) userDisplayName = user.displayName;
      } catch (fbErr: any) {
        console.warn('Firebase signIn notice:', fbErr?.code || fbErr?.message);
        // If owner or staff and user not yet provisioned in Firebase Auth, auto-create
        if (
          (isAdmin || isStaff) &&
          (fbErr?.code === 'auth/user-not-found' || fbErr?.code === 'auth/invalid-credential')
        ) {
          try {
            const newCred = await createUserWithEmailAndPassword(auth, normalizedEmail, pass);
            userId = newCred.user.uid;
          } catch (createErr) {
            console.warn('Auto-create Firebase user note:', createErr);
          }
        } else if (!isAdmin && !isStaff) {
          const msg = fbErr.code ? fbErr.code.replace('auth/', '').replace(/-/g, ' ') : fbErr.message;
          setAuthError(msg);
          return { success: false, error: msg };
        }
      }

      const appUser: User = {
        id: userId,
        name: userDisplayName,
        email: normalizedEmail,
        role: detectedRole,
      };

      setCurrentUser(appUser);
      syncUserProfile(appUser);

      // Route to designated view based on requested role
      if (detectedRole === 'owner') {
        setActiveTab('dashboard');
      } else if (detectedRole === 'staff') {
        setActiveTab('pos');
      } else {
        setActiveTab('shop');
      }

      return { success: true, targetRole: detectedRole };
    } catch (err: any) {
      console.error('Sign in error:', err);
      const msg = err.message || 'Failed to sign in. Please verify credentials.';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  };

  const signInWithGoogle = async (): Promise<{
    success: boolean;
    error?: string;
    targetRole?: UserRole;
    needsDetails?: boolean;
    tempUser?: Partial<User>;
  }> => {
    try {
      setAuthError(null);
      const provider = new GoogleAuthProvider();
      const userCred = await signInWithPopup(auth, provider);
      const user = userCred.user;
      const normalizedEmail = (user.email || '').trim().toLowerCase();

      const isAdmin = normalizedEmail === ADMIN_EMAIL.toLowerCase();
      const isStaff =
        normalizedEmail === STAFF_EMAIL.toLowerCase() ||
        normalizedEmail === STAFF_EMAIL_TYPO.toLowerCase();

      if (isAdmin) {
        const appUser: User = {
          id: user.uid,
          name: 'Frank Edward (Owner)',
          email: normalizedEmail,
          role: 'owner',
        };
        setCurrentUser(appUser);
        await syncUserProfile(appUser);
        setActiveTab('dashboard');
        return { success: true, targetRole: 'owner' };
      }

      if (isStaff) {
        const appUser: User = {
          id: user.uid,
          name: 'Frank Villota (Staff)',
          email: normalizedEmail,
          role: 'staff',
        };
        setCurrentUser(appUser);
        await syncUserProfile(appUser);
        setActiveTab('pos');
        return { success: true, targetRole: 'staff' };
      }

      // Customer account flow:
      // Check existing customer profile in Firestore to see if phone & address are present
      const tempUser: Partial<User> = {
        id: user.uid,
        name: user.displayName || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        role: 'customer',
      };

      try {
        const userDocRef = doc(db, COLLECTIONS.USERS, user.uid);
        const userDocSnap = await getDocFromServer(userDocRef);
        if (userDocSnap.exists()) {
          const data = userDocSnap.data() as User;
          if (data.phone && data.address && data.name) {
            setCurrentUser(data);
            setActiveTab('shop');
            return { success: true, targetRole: 'customer' };
          }
          if (data.phone) tempUser.phone = data.phone;
          if (data.address) tempUser.address = data.address;
          if (data.name) tempUser.name = data.name;
        }
      } catch (err) {
        console.warn('Check existing user doc note:', err);
      }

      // Customer needs to input required contact phone and delivery address
      return {
        success: true,
        needsDetails: true,
        tempUser,
      };
    } catch (err: any) {
      console.error('Google sign in error:', err);
      const msg = err.code ? err.code.replace('auth/', '').replace(/-/g, ' ') : err.message;
      setAuthError(msg);
      return { success: false, error: msg };
    }
  };

  const completeGoogleSignUp = async (params: {
    name: string;
    phone: string;
    address: string;
    tempUser: Partial<User>;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      setAuthError(null);
      if (!params.name.trim() || !params.phone.trim() || !params.address.trim()) {
        const msg = 'Full name, contact phone, and delivery address are all required.';
        setAuthError(msg);
        return { success: false, error: msg };
      }

      const appUser: User = {
        id: params.tempUser.id || `user-${Date.now()}`,
        name: params.name.trim(),
        email: params.tempUser.email || '',
        role: 'customer',
        phone: params.phone.trim(),
        address: params.address.trim(),
      };

      setCurrentUser(appUser);
      await syncUserProfile(appUser);
      setActiveTab('shop');

      return { success: true };
    } catch (err: any) {
      console.error('Complete Google sign up error:', err);
      const msg = err.message || 'Failed to complete profile registration.';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    name: string,
    phone: string,
    address: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setAuthError(null);
      const normalizedEmail = email.trim().toLowerCase();

      // Validate all required fields
      if (
        !name.trim() ||
        !normalizedEmail ||
        !pass.trim() ||
        !phone.trim() ||
        !address.trim()
      ) {
        const errorMsg = 'Full name, email, password, contact phone, and delivery address are all required.';
        setAuthError(errorMsg);
        return { success: false, error: errorMsg };
      }

      // Guard management emails
      if (
        normalizedEmail === ADMIN_EMAIL.toLowerCase() ||
        normalizedEmail === STAFF_EMAIL.toLowerCase() ||
        normalizedEmail === STAFF_EMAIL_TYPO.toLowerCase()
      ) {
        const errorMsg = 'This management account is reserved. Please sign in with your credentials.';
        setAuthError(errorMsg);
        return { success: false, error: errorMsg };
      }

      // Customer account creation in Firebase Auth
      let userId = `user-${Date.now()}`;
      try {
        const userCred = await createUserWithEmailAndPassword(auth, normalizedEmail, pass);
        userId = userCred.user.uid;
      } catch (fbErr: any) {
        console.warn('Firebase createUser notice:', fbErr);
        if (fbErr.code !== 'auth/email-already-in-use') {
          const msg = fbErr.code ? fbErr.code.replace('auth/', '').replace(/-/g, ' ') : fbErr.message;
          setAuthError(msg);
          return { success: false, error: msg };
        }
      }

      const appUser: User = {
        id: userId,
        name: name.trim(),
        email: normalizedEmail,
        role: 'customer',
        phone: phone.trim(),
        address: address.trim(),
      };

      setCurrentUser(appUser);
      await syncUserProfile(appUser);
      setActiveTab('shop');

      return { success: true };
    } catch (err: any) {
      console.warn('Firebase signUp error:', err);
      const msg = err.code ? err.code.replace('auth/', '').replace(/-/g, ' ') : err.message;
      setAuthError(msg);
      return { success: false, error: msg };
    }
  };

  const signOutCurrentUser = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Sign out note:', err);
    }
    setFirebaseUser(null);
    const guestUser: User = {
      id: 'guest',
      name: 'Guest Shopper',
      email: '',
      role: 'customer',
    };
    setCurrentUser(guestUser);
    setActiveTab('shop');
  };

  const switchRole = (role: UserRole) => {
    const matched = initialUsers.find((u) => u.role === role) || initialUsers[2];
    setCurrentUser(matched);
    syncUserProfile(matched);
    if (role === 'customer') {
      setActiveTab('shop');
    } else if (role === 'staff') {
      setActiveTab('pos');
    } else {
      setActiveTab('dashboard');
    }
  };

  // Categories
  const addCategory = (categoryData: Omit<Category, 'id' | 'inStock'>) => {
    const newCategory: Category = {
      ...categoryData,
      id: `cat-${Date.now()}`,
    };
    setCategories((prev) => [...prev, newCategory]);
    saveDocument(COLLECTIONS.CATEGORIES, newCategory);
  };

  const updateCategory = (id: string, updated: Partial<Category>) => {
    setCategories((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...updated } : c));
      const target = next.find((c) => c.id === id);
      if (target) saveDocument(COLLECTIONS.CATEGORIES, target);
      return next;
    });
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    removeDocument(COLLECTIONS.CATEGORIES, id);
  };

  // Suppliers
  const addSupplier = (supplierData: Omit<Supplier, 'id' | 'totalBalesSourced'>) => {
    const newSupplier: Supplier = {
      ...supplierData,
      id: `sup-${Date.now()}`,
      totalBalesSourced: 0,
    };
    setSuppliers((prev) => [...prev, newSupplier]);
    saveDocument(COLLECTIONS.SUPPLIERS, newSupplier);
  };

  const updateSupplier = (id: string, updated: Partial<Supplier>) => {
    setSuppliers((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, ...updated } : s));
      const target = next.find((s) => s.id === id);
      if (target) saveDocument(COLLECTIONS.SUPPLIERS, target);
      return next;
    });
  };

  const deleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    removeDocument(COLLECTIONS.SUPPLIERS, id);
  };

  // Bales
  const addBale = (baleData: Omit<Bale, 'id' | 'pricePerPiece' | 'totalSales'>) => {
    const pricePerPiece =
      baleData.quantity > 0 ? Number((baleData.totalPrice / baleData.quantity).toFixed(2)) : 0;
    const newBale: Bale = {
      ...baleData,
      id: `bale-${Date.now()}`,
      code: `EXINS-BALE-${String(bales.length + 1).padStart(3, '0')}`,
      pricePerPiece,
      totalSales: 0,
      status: 'sealed',
      dateAdded: new Date().toISOString().split('T')[0],
    };
    setBales((prev) => [...prev, newBale]);
    saveDocument(COLLECTIONS.BALES, newBale);

    // Increment supplier bales count
    setSuppliers((prev) => {
      const updated = prev.map((s) => (s.id === baleData.supplierId ? { ...s, totalBalesSourced: s.totalBalesSourced + 1 } : s));
      const targetSup = updated.find((s) => s.id === baleData.supplierId);
      if (targetSup) saveDocument(COLLECTIONS.SUPPLIERS, targetSup);
      return updated;
    });

    // Record bale purchase as an outflow transaction
    const newTx: Transaction = {
      id: `tx-bale-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'outflow',
      category: 'Bale Inventory Purchase',
      description: `Purchased ${baleData.name} (${baleData.quantity} pcs)`,
      paymentMethod: 'bank_transfer',
      inflow: 0,
      outflow: baleData.totalPrice,
      referenceId: newBale.code,
    };
    setTransactions((prev) => [newTx, ...prev]);
    saveDocument(COLLECTIONS.TRANSACTIONS, newTx);
  };

  const updateBale = (id: string, updated: Partial<Bale>) => {
    setBales((prev) => {
      const next = prev.map((b) => {
        if (b.id === id) {
          const combined = { ...b, ...updated };
          if (updated.totalPrice !== undefined || updated.quantity !== undefined) {
            combined.pricePerPiece = combined.quantity > 0 ? Number((combined.totalPrice / combined.quantity).toFixed(2)) : 0;
          }
          return combined;
        }
        return b;
      });
      const target = next.find((b) => b.id === id);
      if (target) saveDocument(COLLECTIONS.BALES, target);
      return next;
    });
  };

  const updateBaleStatus = (id: string, status: 'sealed' | 'opened' | 'depleted') => {
    setBales((prev) => {
      const updated = prev.map((b) => (b.id === id ? { ...b, status } : b));
      const target = updated.find((b) => b.id === id);
      if (target) saveDocument(COLLECTIONS.BALES, target);
      return updated;
    });
  };

  const deleteBale = (id: string) => {
    setBales((prev) => prev.filter((b) => b.id !== id));
    removeDocument(COLLECTIONS.BALES, id);
  };

  // Products
  const addProduct = (productData: Omit<Product, 'id' | 'barcode' | 'dateAdded'>) => {
    const codeNum = Math.floor(1000 + Math.random() * 9000);
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
      barcode: `EXINS-${codeNum}`,
      dateAdded: new Date().toISOString().split('T')[0],
    };
    setProducts((prev) => [newProduct, ...prev]);
    saveDocument(COLLECTIONS.PRODUCTS, newProduct);
  };

  const updateProduct = (id: string, updated: Partial<Product>) => {
    setProducts((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, ...updated } : p));
      const target = next.find((p) => p.id === id);
      if (target) saveDocument(COLLECTIONS.PRODUCTS, target);
      return next;
    });
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setCart((prev) => prev.filter((item) => item.product.id !== id));
    removeDocument(COLLECTIONS.PRODUCTS, id);
  };

  // Cart operations with stock checking and mandatory authentication gate
  const addToCart = (product: Product, quantity = 1): { success: boolean; message: string } => {
    const isGuest = !currentUser.email || currentUser.id === 'guest' || currentUser.id === 'user-guest';
    if (isGuest) {
      return { success: false, message: 'AUTH_REQUIRED' };
    }

    const existing = cart.find((item) => item.product.id === product.id);
    const currentCartQty = existing ? existing.quantity : 0;
    const availableStock = product.quantity;

    if (availableStock <= 0) {
      return { success: false, message: `"${product.name}" is currently out of stock.` };
    }

    if (currentCartQty + quantity > availableStock) {
      return {
        success: false,
        message: `Only ${availableStock} left in stock for "${product.name}"! Cannot add more.`,
      };
    }

    setCart((prev) => {
      const idx = prev.findIndex((item) => item.product.id === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
        return next;
      }
      return [...prev, { product, quantity }];
    });

    return { success: true, message: `Added ${product.name} to your bag!` };
  };

  const updateCartQty = (productId: string, delta: number): { success: boolean; message?: string } => {
    const product = products.find((p) => p.id === productId);
    const existing = cart.find((item) => item.product.id === productId);

    if (!existing || !product) return { success: false };

    const newQty = existing.quantity + delta;
    if (newQty < 1) {
      removeFromCart(productId);
      return { success: true };
    }

    if (newQty > product.quantity) {
      return {
        success: false,
        message: `Only ${product.quantity} left in stock for "${product.name}"!`,
      };
    }

    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity: newQty } : item))
    );
    return { success: true };
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  // Orders
  const createOrder = (orderData: Omit<Order, 'id' | 'orderNumber' | 'status' | 'orderDate'>): Order => {
    const orderNum = `EXINS-ORD-${Math.floor(100 + Math.random() * 900)}`;
    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      orderNumber: orderNum,
      status: 'pending',
      orderDate: new Date().toISOString().split('T')[0],
    };

    // Deduct product stock immediately to reserve items
    setProducts((prev) => {
      const updated = prev.map((p) => {
        const orderedItem = orderData.items.find((item) => item.product.id === p.id);
        if (orderedItem) {
          const nextQty = Math.max(0, p.quantity - orderedItem.quantity);
          const updatedProd = { ...p, quantity: nextQty };
          saveDocument(COLLECTIONS.PRODUCTS, updatedProd);
          return updatedProd;
        }
        return p;
      });
      return updated;
    });

    setOrders((prev) => [newOrder, ...prev]);
    saveDocument(COLLECTIONS.ORDERS, newOrder);

    // Record downpayment or full payment in cashflow transactions
    const paymentCollected =
      orderData.paymentType === 'down_payment'
        ? orderData.downPaymentAmount
        : orderData.totalAmount;
    if (paymentCollected > 0) {
      const newTx: Transaction = {
        id: `tx-ord-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        type: 'inflow',
        category: 'Online Showcase Order',
        description: `Order ${orderNum} deposit from ${orderData.customerName}`,
        paymentMethod: 'gcash',
        inflow: paymentCollected,
        outflow: 0,
        referenceId: orderNum,
      };
      setTransactions((prev) => [newTx, ...prev]);
      saveDocument(COLLECTIONS.TRANSACTIONS, newTx);
    }

    clearCart();
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) => {
      const updated = prev.map((o) => (o.id === orderId ? { ...o, status } : o));
      const target = updated.find((o) => o.id === orderId);
      if (target) saveDocument(COLLECTIONS.ORDERS, target);
      return updated;
    });
  };

  const cancelOrder = (orderId: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder || targetOrder.status === 'cancelled') return;

    // Restore inventory quantities
    setProducts((prev) => {
      const restored = prev.map((p) => {
        const item = targetOrder.items.find((i) => i.product.id === p.id);
        if (item) {
          const updatedProd = { ...p, quantity: p.quantity + item.quantity };
          saveDocument(COLLECTIONS.PRODUCTS, updatedProd);
          return updatedProd;
        }
        return p;
      });
      return restored;
    });

    updateOrderStatus(orderId, 'cancelled');
  };

  // Expense Accounts
  const addExpenseAccount = (accountData: Omit<ExpenseAccount, 'id' | 'totalSpent'>) => {
    const newAccount: ExpenseAccount = {
      ...accountData,
      id: `acc-${Date.now()}`,
      totalSpent: 0,
    };
    setExpenseAccounts((prev) => [...prev, newAccount]);
    saveDocument(COLLECTIONS.EXPENSE_ACCOUNTS, newAccount);
  };

  const updateExpenseAccount = (id: string, updated: Partial<ExpenseAccount>) => {
    setExpenseAccounts((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, ...updated } : a));
      const target = next.find((a) => a.id === id);
      if (target) saveDocument(COLLECTIONS.EXPENSE_ACCOUNTS, target);
      return next;
    });
  };

  const deleteExpenseAccount = (id: string) => {
    setExpenseAccounts((prev) => prev.filter((a) => a.id !== id));
    removeDocument(COLLECTIONS.EXPENSE_ACCOUNTS, id);
  };

  // Expenses
  const addExpense = (expenseData: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
    };
    setExpenses((prev) => [newExpense, ...prev]);
    saveDocument(COLLECTIONS.EXPENSES, newExpense);

    // Update account spent sum
    setExpenseAccounts((prev) => {
      const updated = prev.map((acc) =>
        acc.id === expenseData.accountId
          ? { ...acc, totalSpent: acc.totalSpent + expenseData.amount }
          : acc
      );
      const target = updated.find((acc) => acc.id === expenseData.accountId);
      if (target) saveDocument(COLLECTIONS.EXPENSE_ACCOUNTS, target);
      return updated;
    });

    // Create Outflow Transaction
    const accountName =
      expenseAccounts.find((a) => a.id === expenseData.accountId)?.name || 'Operating Expense';
    const newTx: Transaction = {
      id: `tx-exp-${Date.now()}`,
      date: expenseData.date,
      type: 'outflow',
      category: accountName,
      description: expenseData.description,
      paymentMethod: expenseData.paymentMethod,
      inflow: 0,
      outflow: expenseData.amount,
      referenceId: newExpense.id,
    };
    setTransactions((prev) => [newTx, ...prev]);
    saveDocument(COLLECTIONS.TRANSACTIONS, newTx);
  };

  const updateExpense = (id: string, updated: Partial<Expense>) => {
    setExpenses((prev) => {
      const next = prev.map((e) => (e.id === id ? { ...e, ...updated } : e));
      const target = next.find((e) => e.id === id);
      if (target) saveDocument(COLLECTIONS.EXPENSES, target);
      return next;
    });
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    removeDocument(COLLECTIONS.EXPENSES, id);
  };

  // Transactions
  const addTransaction = (txData: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}`,
    };
    setTransactions((prev) => [newTx, ...prev]);
    saveDocument(COLLECTIONS.TRANSACTIONS, newTx);
  };

  const updateTransaction = (id: string, updated: Partial<Transaction>) => {
    setTransactions((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, ...updated } : t));
      const target = next.find((t) => t.id === id);
      if (target) saveDocument(COLLECTIONS.TRANSACTIONS, target);
      return next;
    });
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    removeDocument(COLLECTIONS.TRANSACTIONS, id);
  };

  // POS Sale Confirmation
  const processPosSale = (params: {
    customerName?: string;
    items: CartItem[];
    subtotal: number;
    discount: number;
    totalDue: number;
    paymentMethod: PaymentMethod;
    amountTendered: number;
    change: number;
  }): { success: boolean; receiptData: any } => {
    const receiptNumber = `EXINS-POS-${Math.floor(1000 + Math.random() * 9000)}`;
    const saleDate = new Date().toISOString().split('T')[0];

    // Deduct product stock from database
    setProducts((prev) => {
      const updated = prev.map((p) => {
        const soldItem = params.items.find((item) => item.product.id === p.id);
        if (soldItem) {
          const nextQty = Math.max(0, p.quantity - soldItem.quantity);
          const updatedProd = { ...p, quantity: nextQty };
          saveDocument(COLLECTIONS.PRODUCTS, updatedProd);
          return updatedProd;
        }
        return p;
      });
      return updated;
    });

    // Record total sales to the source bales to update break-even trackers
    params.items.forEach((item) => {
      if (item.product.baleId) {
        const itemSaleRevenue = item.product.sellingPrice * item.quantity;
        setBales((prev) => {
          const next = prev.map((b) => {
            if (b.id === item.product.baleId) {
              const updatedBale = { ...b, totalSales: b.totalSales + itemSaleRevenue };
              saveDocument(COLLECTIONS.BALES, updatedBale);
              return updatedBale;
            }
            return b;
          });
          return next;
        });
      }
    });

    // Record Inflow Transaction
    const newTx: Transaction = {
      id: `tx-pos-${Date.now()}`,
      date: saleDate,
      type: 'inflow',
      category: 'POS Storefront Sale',
      description: `POS counter sale (${params.items.reduce((s, i) => s + i.quantity, 0)} items) - ${params.customerName || 'Walk-in'}`,
      paymentMethod: params.paymentMethod,
      inflow: params.totalDue,
      outflow: 0,
      referenceId: receiptNumber,
    };
    setTransactions((prev) => [newTx, ...prev]);
    saveDocument(COLLECTIONS.TRANSACTIONS, newTx);

    // Update Transaction Stats
    setTransactionStats((prev) => ({
      ...prev,
      sold: prev.sold + params.items.reduce((s, i) => s + i.quantity, 0),
    }));

    const receiptData = {
      receiptNumber,
      date: new Date().toLocaleString('en-PH'),
      cashier: currentUser.name,
      customerName: params.customerName || 'Walk-in Customer',
      items: params.items.map((i) => ({
        id: i.product.id,
        name: i.product.name,
        barcode: i.product.barcode,
        size: i.product.size,
        price: i.product.sellingPrice,
        quantity: i.quantity,
        total: i.product.sellingPrice * i.quantity,
      })),
      subtotal: params.subtotal,
      discount: params.discount,
      totalDue: params.totalDue,
      paymentMethod: params.paymentMethod,
      amountTendered: params.amountTendered,
      change: params.change,
    };

    setSelectedReceipt(receiptData);
    return { success: true, receiptData };
  };

  const resetAllData = async () => {
    localStorage.removeItem(`${STORAGE_KEY}_categories`);
    localStorage.removeItem(`${STORAGE_KEY}_suppliers`);
    localStorage.removeItem(`${STORAGE_KEY}_bales`);
    localStorage.removeItem(`${STORAGE_KEY}_products`);
    localStorage.removeItem(`${STORAGE_KEY}_orders`);
    localStorage.removeItem(`${STORAGE_KEY}_expenseAccounts`);
    localStorage.removeItem(`${STORAGE_KEY}_expenses`);
    localStorage.removeItem(`${STORAGE_KEY}_transactions`);
    localStorage.removeItem(`${STORAGE_KEY}_transactionStats`);
    localStorage.removeItem(`${STORAGE_KEY}_cart`);

    setCategories(initialCategories);
    setSuppliers(initialSuppliers);
    setBales([]);
    setProducts([]);
    setOrders([]);
    setExpenseAccounts(initialExpenseAccounts);
    setExpenses([]);
    setTransactions([]);
    setTransactionStats({ sold: 0, returned: 0, damaged: 0, lost: 0 });
    setCart([]);

    // Clear Firestore database collections
    await clearAllInventoryAndFinancialRecords();
  };

  return (
    <StoreContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchRole,
        isDark,
        toggleTheme,
        isFirebaseConnected,
        firebaseUser,
        authError,
        clearAuthError,
        signInWithEmail,
        signInWithGoogle,
        completeGoogleSignUp,
        signUpWithEmail,
        signOutCurrentUser,
        activeTab,
        setActiveTab,
        shopView,
        setShopView,
        inventoryTab,
        setInventoryTab,
        financeTab,
        setFinanceTab,
        forecastingTab,
        setForecastingTab,
        categories: categoriesWithStock,
        addCategory,
        updateCategory,
        deleteCategory,
        suppliers,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        bales,
        addBale,
        updateBale,
        updateBaleStatus,
        deleteBale,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        cart,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        orders,
        createOrder,
        updateOrderStatus,
        cancelOrder,
        expenseAccounts,
        addExpenseAccount,
        updateExpenseAccount,
        deleteExpenseAccount,
        expenses,
        addExpense,
        updateExpense,
        deleteExpense,
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        transactionStats,
        processPosSale,
        resetAllData,
        selectedReceipt,
        setSelectedReceipt,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
