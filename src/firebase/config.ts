import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInAnonymously,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Cloud Firestore with specified database ID
export const db: Firestore = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Connection state indicator
let isConnected = false;
export const checkFirestoreConnection = async (): Promise<boolean> => {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    isConnected = true;
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or initializing.', error);
    }
    return isConnected;
  }
};

// Test initial connection as required by Firebase Skill
checkFirestoreConnection().catch((err) => console.log('Initial Firebase health check note:', err?.message));

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInAnonymously,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  doc,
  getDocFromServer,
};
export type { FirebaseUser };
