export type UserRole = 'owner' | 'staff' | 'customer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  address?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  inStock?: number;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  description: string;
  totalBalesSourced: number;
}

export interface Bale {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  supplierId: string;
  totalPrice: number;
  quantity: number; // piece count
  pricePerPiece: number;
  description: string;
  totalSales: number;
  status: 'sealed' | 'opened' | 'depleted';
  dateAdded: string;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  baleId: string;
  quantity: number;
  sellingPrice: number;
  costPrice: number;
  size: string;
  image: string;
  link: string;
  description: string;
  barcode: string;
  dateAdded: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type PaymentMethod = 'cash' | 'gcash' | 'bank_transfer' | 'card';

export type Courier = 'lbc' | 'lalamove' | 'jnt';

export type OrderStatus =
  | 'pending'
  | 'preparing_the_order'
  | 'dropped_to_courier'
  | 'completed'
  | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  contactNumber: string;
  email: string;
  address: string;
  items: CartItem[];
  totalAmount: number;
  paymentType: 'pay_now' | 'down_payment';
  downPaymentAmount: number;
  remainingBalance: number;
  receiptImage?: string;
  courier: Courier;
  status: OrderStatus;
  orderDate: string;
  notes?: string;
}

export interface ExpenseAccount {
  id: string;
  name: string;
  monthlyBudget: number;
  description: string;
  totalSpent: number;
}

export interface Expense {
  id: string;
  accountId: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  receiptImage?: string;
  description: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: 'inflow' | 'outflow';
  category: string;
  description: string;
  paymentMethod: PaymentMethod;
  inflow: number;
  outflow: number;
  referenceId?: string;
}

export interface TransactionStats {
  sold: number;
  returned: number;
  damaged: number;
  lost: number;
}

export interface CustomerSpender {
  name: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
}
