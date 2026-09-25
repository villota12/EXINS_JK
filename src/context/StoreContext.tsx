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
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInAnonymously,
  onAuthStateChanged,
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
} from '../firebase/dbService';

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
  signInWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (
    email: string,
    pass: string,
    name: string,
    role: UserRole,
    phone?: string,
    address?: string
  ) => Promise<{ success: boolean; error?: string }>;
  signOutCurrentUser: () => Promise<void>;

  // Navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;
  shopView: 'browse' | 'orders';
  setShopView: (view: 'browse' | 'orders') => void;
  inventoryTab: 'bales' | 'categories' | 'products' | 'suppliers';
  setInventoryTab: (tab: 'bales' | 'categories' | 'products' | 'suppliers') => void;
  financeTab: 'accounts' | 'record' | 'history';
  setFinanceTab: (tab: 'accounts' | 'record' | 'history') => void;
  forecastingTab: 'ewma' | 'top_spenders' | 'stats';
  setForecastingTab: (tab: 'ewma' | 'top_spenders' | 'stats') => void;

  // Data Collections
  categories: Category[];
  addCategory: (category: Omit<Category, 'id' | 'inStock'>) => void;

  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'totalBalesSourced'>) => void;

  bales: Bale[];
  addBale: (bale: Omit<Bale, 'id' | 'pricePerPiece' | 'totalSales'>) => void;
  updateBaleStatus: (id: string, status: 'sealed' | 'opened' | 'depleted') => void;

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
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;

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

const STORAGE_KEY = 'exins_management_store_data_v1';

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

  // Auth & Roles
  const [currentUser, setCurrentUser] = useState<User>(() => initialUsers[0]);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = () => setAuthError(null);

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [shopView, setShopView] = useState<'browse' | 'orders'>('browse');
  const [inventoryTab, setInventoryTab] = useState<'bales' | 'categories' | 'products' | 'suppliers'>('bales');
  const [financeTab, setFinanceTab] = useState<'accounts' | 'record' | 'history'>('accounts');
  const [forecastingTab, setForecastingTab] = useState<'ewma' | 'top_spenders' | 'stats'>('ewma');

  // Printable receipt modal state
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  // Entities state
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

    // Seed initial collections in Firestore if empty
    seedCollectionIfEmpty(COLLECTIONS.CATEGORIES, initialCategories);
    seedCollectionIfEmpty(COLLECTIONS.SUPPLIERS, initialSuppliers);
    seedCollectionIfEmpty(COLLECTIONS.BALES, initialBales);
    seedCollectionIfEmpty(COLLECTIONS.PRODUCTS, initialProducts);
    seedCollectionIfEmpty(COLLECTIONS.ORDERS, initialOrders);
    seedCollectionIfEmpty(COLLECTIONS.EXPENSE_ACCOUNTS, initialExpenseAccounts);
    seedCollectionIfEmpty(COLLECTIONS.EXPENSES, initialExpenses);
    seedCollectionIfEmpty(COLLECTIONS.TRANSACTIONS, initialTransactions);

    // Listen to Firebase Auth state
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!isMounted) return;
      setFirebaseUser(user);
      if (user) {
        setIsFirebaseConnected(true);
        // If user is signed in with email/uid, ensure role is preserved
        const savedRole = (localStorage.getItem(`exins_user_role_${user.uid}`) as UserRole) || 'customer';
        setCurrentUser((prev) => ({
          id: user.uid,
          name: user.displayName || user.email?.split('@')[0] || prev.name,
          email: user.email || prev.email,
          role: prev.role || savedRole,
          phone: prev.phone,
          address: prev.address,
        }));
      }
    });

    // Real-time Firestore Listeners
    const unsubCategories = subscribeToCollection<Category>(COLLECTIONS.CATEGORIES, (items) => {
      if (items.length > 0 && isMounted) setCategories(items);
    });

    const unsubSuppliers = subscribeToCollection<Supplier>(COLLECTIONS.SUPPLIERS, (items) => {
      if (items.length > 0 && isMounted) setSuppliers(items);
    });

    const unsubBales = subscribeToCollection<Bale>(COLLECTIONS.BALES, (items) => {
      if (items.length > 0 && isMounted) setBales(items);
    });

    const unsubProducts = subscribeToCollection<Product>(COLLECTIONS.PRODUCTS, (items) => {
      if (items.length > 0 && isMounted) setProducts(items);
    });

    const unsubOrders = subscribeToCollection<Order>(COLLECTIONS.ORDERS, (items) => {
      if (items.length > 0 && isMounted) setOrders(items);
    });

    const unsubAccounts = subscribeToCollection<ExpenseAccount>(COLLECTIONS.EXPENSE_ACCOUNTS, (items) => {
      if (items.length > 0 && isMounted) setExpenseAccounts(items);
    });

    const unsubExpenses = subscribeToCollection<Expense>(COLLECTIONS.EXPENSES, (items) => {
      if (items.length > 0 && isMounted) setExpenses(items);
    });

    const unsubTxs = subscribeToCollection<Transaction>(COLLECTIONS.TRANSACTIONS, (items) => {
      if (items.length > 0 && isMounted) setTransactions(items);
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
  const signInWithEmail = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setAuthError(null);
      const userCred = await signInWithEmailAndPassword(auth, email, pass);
      const user = userCred.user;
      const detectedRole: UserRole = email.includes('owner') ? 'owner' : email.includes('staff') ? 'staff' : 'customer';
      const appUser: User = {
        id: user.uid,
        name: user.displayName || email.split('@')[0],
        email: user.email || email,
        role: detectedRole,
      };
      setCurrentUser(appUser);
      localStorage.setItem(`exins_user_role_${user.uid}`, detectedRole);
      syncUserProfile(appUser);
      return { success: true };
    } catch (err: any) {
      console.warn('Firebase signIn error:', err);
      const msg = err.code ? err.code.replace('auth/', '').replace(/-/g, ' ') : err.message;
      setAuthError(msg);
      return { success: false, error: msg };
    }
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    name: string,
    role: UserRole,
    phone?: string,
    address?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setAuthError(null);
      const userCred = await createUserWithEmailAndPassword(auth, email, pass);
      const user = userCred.user;
      const appUser: User = {
        id: user.uid,
        name: name || email.split('@')[0],
        email: user.email || email,
        role,
        phone,
        address,
      };
      setCurrentUser(appUser);
      localStorage.setItem(`exins_user_role_${user.uid}`, role);
      await syncUserProfile(appUser);
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
      setFirebaseUser(null);
      // Switch back to customer guest
      switchRole('customer');
    } catch (err) {
      console.warn('Sign out note:', err);
    }
  };

  const switchRole = (role: UserRole) => {
    const matched = initialUsers.find((u) => u.role === role) || {
      id: `user-${role}`,
      name: role === 'owner' ? 'Frank Edward (Owner)' : role === 'staff' ? 'Store Assistant' : 'Shopper Customer',
      email: `${role}@exins.ph`,
      role,
    };
    setCurrentUser(matched);
    syncUserProfile(matched);

    // If customer, switch view directly to showcase shop
    if (role === 'customer') {
      setActiveTab('shop');
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

  // Bale Management
  const addBale = (baleData: Omit<Bale, 'id' | 'pricePerPiece' | 'totalSales'>) => {
    const pricePerPiece = baleData.quantity > 0 ? Number((baleData.totalPrice / baleData.quantity).toFixed(2)) : 0;
    const newBale: Bale = {
      ...baleData,
      id: `bale-${Date.now()}`,
      pricePerPiece,
      totalSales: 0,
    };

    setBales((prev) => [newBale, ...prev]);
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

  const updateBaleStatus = (id: string, status: 'sealed' | 'opened' | 'depleted') => {
    setBales((prev) => {
      const updated = prev.map((b) => (b.id === id ? { ...b, status } : b));
      const target = updated.find((b) => b.id === id);
      if (target) saveDocument(COLLECTIONS.BALES, target);
      return updated;
    });
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

  // Cart operations with stock checking!
  const addToCart = (product: Product, quantity = 1): { success: boolean; message: string } => {
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
          const newQty = Math.max(0, p.quantity - orderedItem.quantity);
          const nextProduct = { ...p, quantity: newQty };
          saveDocument(COLLECTIONS.PRODUCTS, nextProduct);
          return nextProduct;
        }
        return p;
      });
      return updated;
    });

    // Record inflow transaction for pay now or down payment
    const inflowAmount =
      orderData.paymentType === 'down_payment' ? orderData.downPaymentAmount : orderData.totalAmount;

    const newTx: Transaction = {
      id: `tx-order-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'inflow',
      category: 'Online Showcase Order',
      description: `Order ${orderNum} payment by ${orderData.customerName} (${orderData.paymentType === 'down_payment' ? '₱100 Downpayment' : 'Full Payment'})`,
      paymentMethod: 'gcash',
      inflow: inflowAmount,
      outflow: 0,
      referenceId: orderNum,
    };

    setTransactions((prev) => [newTx, ...prev]);
    saveDocument(COLLECTIONS.TRANSACTIONS, newTx);

    // Update bale sales credit for each item
    orderData.items.forEach((item) => {
      const itemRev = item.product.sellingPrice * item.quantity;
      if (item.product.baleId) {
        setBales((prev) => {
          const updated = prev.map((b) => (b.id === item.product.baleId ? { ...b, totalSales: b.totalSales + itemRev } : b));
          const targetBale = updated.find((b) => b.id === item.product.baleId);
          if (targetBale) saveDocument(COLLECTIONS.BALES, targetBale);
          return updated;
        });
      }
    });

    setOrders((prev) => [newOrder, ...prev]);
    saveDocument(COLLECTIONS.ORDERS, newOrder);
    clearCart();

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) => {
      const updated = prev.map((o) => {
        if (o.id === orderId) {
          if (status === 'completed' && o.remainingBalance > 0 && o.status !== 'completed') {
            const finalBalTx: Transaction = {
              id: `tx-bal-${Date.now()}`,
              date: new Date().toISOString().split('T')[0],
              type: 'inflow',
              category: 'Online Showcase Order',
              description: `Remaining balance payment for ${o.orderNumber} (${o.customerName})`,
              paymentMethod: 'cash',
              inflow: o.remainingBalance,
              outflow: 0,
              referenceId: o.orderNumber,
            };
            setTransactions((txs) => [finalBalTx, ...txs]);
            saveDocument(COLLECTIONS.TRANSACTIONS, finalBalTx);
            const resolved = { ...o, status, remainingBalance: 0 };
            saveDocument(COLLECTIONS.ORDERS, resolved);
            return resolved;
          }
          const next = { ...o, status };
          saveDocument(COLLECTIONS.ORDERS, next);
          return next;
        }
        return o;
      });
      return updated;
    });
  };

  const cancelOrder = (orderId: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder || targetOrder.status === 'completed' || targetOrder.status === 'cancelled') return;

    // Restore inventory quantities
    setProducts((prev) => {
      const restored = prev.map((p) => {
        const item = targetOrder.items.find((it) => it.product.id === p.id);
        if (item) {
          const next = { ...p, quantity: p.quantity + item.quantity };
          saveDocument(COLLECTIONS.PRODUCTS, next);
          return next;
        }
        return p;
      });
      return restored;
    });

    // Update order status to cancelled
    setOrders((prev) => {
      const updated = prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' as OrderStatus } : o));
      const target = updated.find((o) => o.id === orderId);
      if (target) saveDocument(COLLECTIONS.ORDERS, target);
      return updated;
    });

    // Track in stats
    setTransactionStats((prev) => ({ ...prev, returned: prev.returned + 1 }));
  };

  // Expense Accounts & Recording
  const addExpenseAccount = (accountData: Omit<ExpenseAccount, 'id' | 'totalSpent'>) => {
    const newAcc: ExpenseAccount = {
      ...accountData,
      id: `exp-acc-${Date.now()}`,
      totalSpent: 0,
    };
    setExpenseAccounts((prev) => [...prev, newAcc]);
    saveDocument(COLLECTIONS.EXPENSE_ACCOUNTS, newAcc);
  };

  const addExpense = (expenseData: Omit<Expense, 'id'>) => {
    const newExp: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
    };
    setExpenses((prev) => [newExp, ...prev]);
    saveDocument(COLLECTIONS.EXPENSES, newExp);

    // Update account spent total
    setExpenseAccounts((prev) => {
      const next = prev.map((acc) =>
        acc.id === expenseData.accountId ? { ...acc, totalSpent: acc.totalSpent + expenseData.amount } : acc
      );
      const targetAcc = next.find((a) => a.id === expenseData.accountId);
      if (targetAcc) saveDocument(COLLECTIONS.EXPENSE_ACCOUNTS, targetAcc);
      return next;
    });

    const account = expenseAccounts.find((a) => a.id === expenseData.accountId);
    // Record in transactions
    const newTx: Transaction = {
      id: `tx-exp-${Date.now()}`,
      date: expenseData.date,
      type: 'outflow',
      category: account ? account.name : 'Operating Expense',
      description: expenseData.description || 'Recorded expense disbursement',
      paymentMethod: expenseData.paymentMethod,
      inflow: 0,
      outflow: expenseData.amount,
      referenceId: newExp.id,
    };
    setTransactions((prev) => [newTx, ...prev]);
    saveDocument(COLLECTIONS.TRANSACTIONS, newTx);
  };

  const addTransaction = (txData: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}`,
    };
    setTransactions((prev) => [newTx, ...prev]);
    saveDocument(COLLECTIONS.TRANSACTIONS, newTx);
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
  }) => {
    const receiptNumber = `POS-${new Date().toISOString().replace(/\D/g, '').slice(0, 12)}`;
    const custName = params.customerName?.trim() || 'Walk-in Customer';

    // 1. Deduct product quantities
    setProducts((prev) => {
      const updated = prev.map((p) => {
        const posItem = params.items.find((item) => item.product.id === p.id);
        if (posItem) {
          const newQty = Math.max(0, p.quantity - posItem.quantity);
          const next = { ...p, quantity: newQty };
          saveDocument(COLLECTIONS.PRODUCTS, next);
          return next;
        }
        return p;
      });
      return updated;
    });

    // 2. Add transaction inflow
    const newTx: Transaction = {
      id: `tx-pos-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'inflow',
      category: 'POS Storefront Sale',
      description: `POS #${receiptNumber} - ${custName} (${params.items.length} items)`,
      paymentMethod: params.paymentMethod,
      inflow: params.totalDue,
      outflow: 0,
      referenceId: receiptNumber,
    };
    setTransactions((prev) => [newTx, ...prev]);
    saveDocument(COLLECTIONS.TRANSACTIONS, newTx);

    // 3. Credit bales totalSales
    params.items.forEach((item) => {
      const itemRev = item.product.sellingPrice * item.quantity;
      if (item.product.baleId) {
        setBales((prev) => {
          const updated = prev.map((b) => (b.id === item.product.baleId ? { ...b, totalSales: b.totalSales + itemRev } : b));
          const target = updated.find((b) => b.id === item.product.baleId);
          if (target) saveDocument(COLLECTIONS.BALES, target);
          return updated;
        });
      }
    });

    // 4. Update sold stats
    const totalPieces = params.items.reduce((sum, item) => sum + item.quantity, 0);
    setTransactionStats((prev) => ({ ...prev, sold: prev.sold + totalPieces }));

    const receiptData = {
      type: 'pos',
      receiptNumber,
      date: new Date().toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }),
      customerName: custName,
      items: params.items,
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

  const resetAllData = () => {
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
    setBales(initialBales);
    setProducts(initialProducts);
    setOrders(initialOrders);
    setExpenseAccounts(initialExpenseAccounts);
    setExpenses(initialExpenses);
    setTransactions(initialTransactions);
    setTransactionStats(initialTransactionStats);
    setCart([]);
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
        suppliers,
        addSupplier,
        bales,
        addBale,
        updateBaleStatus,
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
        expenses,
        addExpense,
        transactions,
        addTransaction,
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
