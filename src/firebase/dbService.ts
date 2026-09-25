import {
  db,
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
} from './config';
import {
  Category,
  Supplier,
  Bale,
  Product,
  Order,
  ExpenseAccount,
  Expense,
  Transaction,
  User,
} from '../types';

export const COLLECTIONS = {
  USERS: 'users',
  CATEGORIES: 'categories',
  SUPPLIERS: 'suppliers',
  BALES: 'bales',
  PRODUCTS: 'products',
  ORDERS: 'orders',
  EXPENSE_ACCOUNTS: 'expenseAccounts',
  EXPENSES: 'expenses',
  TRANSACTIONS: 'transactions',
} as const;

// Generic helper to save or update document
export async function saveDocument<T extends { id: string }>(
  collectionName: string,
  item: T
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, item.id);
    await setDoc(docRef, item, { merge: true });
  } catch (error) {
    console.error(`Failed to save to ${collectionName}:`, error);
  }
}

// Generic helper to remove document
export async function removeDocument(
  collectionName: string,
  id: string
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Failed to delete from ${collectionName}:`, error);
  }
}

// Subscribe to collection changes in real time
export function subscribeToCollection<T>(
  collectionName: string,
  callback: (items: T[]) => void,
  onError?: (error: any) => void
) {
  const colRef = collection(db, collectionName);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: T[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as T);
      });
      callback(items);
    },
    (error) => {
      console.warn(`Firestore onSnapshot for ${collectionName}:`, error.message);
      if (onError) onError(error);
    }
  );
}

// Seed initial dataset if collection is empty
export async function seedCollectionIfEmpty<T extends { id: string }>(
  collectionName: string,
  initialItems: T[]
): Promise<void> {
  try {
    const colRef = collection(db, collectionName);
    const snap = await getDocs(colRef);
    if (snap.empty && initialItems.length > 0) {
      console.log(`Seeding initial data for ${collectionName}...`);
      for (const item of initialItems) {
        await setDoc(doc(db, collectionName, item.id), item);
      }
    }
  } catch (error) {
    console.warn(`Seeding ${collectionName} note:`, error);
  }
}

// Save user profile in Firestore
export async function syncUserProfile(user: User): Promise<void> {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, user.id);
    await setDoc(
      userRef,
      {
        ...user,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('Sync user profile note:', error);
  }
}
