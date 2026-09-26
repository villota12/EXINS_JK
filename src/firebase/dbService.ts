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

// Delete all documents in a collection
export async function clearCollection(collectionName: string): Promise<void> {
  try {
    const colRef = collection(db, collectionName);
    const snap = await getDocs(colRef);
    const deletePromises = snap.docs.map((docSnap) => deleteDoc(docSnap.ref));
    await Promise.all(deletePromises);
    console.log(`Cleared all records from Firestore ${collectionName} collection.`);
  } catch (error) {
    console.warn(`Failed to clear collection ${collectionName}:`, error);
  }
}

// Purge all records of inventory, orders, expenses, and transactions while keeping user accounts
export async function clearAllInventoryAndFinancialRecords(): Promise<void> {
  await Promise.all([
    clearCollection(COLLECTIONS.BALES),
    clearCollection(COLLECTIONS.PRODUCTS),
    clearCollection(COLLECTIONS.ORDERS),
    clearCollection(COLLECTIONS.EXPENSES),
    clearCollection(COLLECTIONS.TRANSACTIONS),
    clearCollection(COLLECTIONS.SUPPLIERS),
  ]);
  console.log('Successfully wiped inventory, orders, suppliers, and financial history from Firestore.');
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

// Seed initial dataset if collection is empty (No-op: user requested 100% clean database)
export async function seedCollectionIfEmpty<T extends { id: string }>(
  _collectionName: string,
  _initialItems: T[]
): Promise<void> {
  // Pure empty database requested: do not seed
  return;
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
