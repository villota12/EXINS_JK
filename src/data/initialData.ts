import {
  Category,
  Supplier,
  Bale,
  Product,
  ExpenseAccount,
  Expense,
  Transaction,
  Order,
  TransactionStats,
  User,
} from '../types';

// Clean empty starting state ready for user to register their own categories
export const initialCategories: Category[] = [];

// Clean empty starting state ready for user to register actual suppliers
export const initialSuppliers: Supplier[] = [];

// Clean empty starting state ready for real inventory & transactions
export const initialBales: Bale[] = [];

export const initialProducts: Product[] = [];

export const initialOrders: Order[] = [];

// Clean empty starting state ready for user to register their own expense accounts
export const initialExpenseAccounts: ExpenseAccount[] = [];

export const initialExpenses: Expense[] = [];

export const initialTransactions: Transaction[] = [];

export const initialTransactionStats: TransactionStats = {
  sold: 0,
  returned: 0,
  damaged: 0,
  lost: 0,
};

export const initialUsers: User[] = [
  {
    id: 'user-owner',
    name: 'Frank Edward (Owner)',
    email: 'villotafrankedward@gmail.com',
    role: 'owner',
    phone: '+63 917 123 4567',
    address: 'Novaliches, Quezon City',
  },
  {
    id: 'user-staff',
    name: 'Frank Villota (Staff)',
    email: 'frankvillota905@gmail.com',
    role: 'staff',
    phone: '+63 920 333 4455',
    address: 'Quirino Highway, Novaliches, QC',
  },
  {
    id: 'guest',
    name: 'Guest Shopper',
    email: '',
    role: 'customer',
    phone: '',
    address: '',
  },
];
