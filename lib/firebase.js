import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

export const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_API_KEY) ||
    '',
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN) ||
    '',
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_PROJECT_ID) ||
    '',
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET) ||
    '',
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID) ||
    '',
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_APP_ID) ||
    '',
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID) ||
    '',
};

const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.apiKey.trim());

// Singleton App Instance
export const app =
  getApps().length > 0
    ? getApp()
    : isFirebaseConfigured
      ? initializeApp(firebaseConfig)
      : null;

// Firebase Authentication Instance
export const auth = app ? getAuth(app) : null;

// Providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Safe Analytics helper
let analyticsInstance = null;
let analyticsPromise = null;
export async function getFirebaseAnalytics() {
  if (typeof window === 'undefined' || !app) return null;
  if (analyticsInstance) return analyticsInstance;
  if (!analyticsPromise) {
    analyticsPromise = isSupported().then((supported) => {
      if (supported && firebaseConfig.measurementId && app) {
        analyticsInstance = getAnalytics(app);
        return analyticsInstance;
      }
      return null;
    });
  }
  return analyticsPromise;
}

// ── Auth Helpers ─────────────────────────────────────────────────────────────

/**
 * 1. Google Sign-In Popup
 */
export async function signInWithGooglePopup() {
  if (!auth) {
    throw new Error('Firebase Authentication is not configured. Missing NEXT_PUBLIC_FIREBASE_API_KEY.');
  }
  return await signInWithPopup(auth, googleProvider);
}

/**
 * 2. Email / Password Sign In
 */
export async function signInWithEmail(email, password) {
  if (!auth) {
    throw new Error('Firebase Authentication is not configured. Missing NEXT_PUBLIC_FIREBASE_API_KEY.');
  }
  return await signInWithEmailAndPassword(auth, email, password);
}

/**
 * 2b. Email / Password Sign Up
 */
export async function signUpWithEmail(email, password) {
  if (!auth) {
    throw new Error('Firebase Authentication is not configured. Missing NEXT_PUBLIC_FIREBASE_API_KEY.');
  }
  return await createUserWithEmailAndPassword(auth, email, password);
}

/**
 * 3. Phone SMS Disabled
 */
export function createPhoneVerifier() {
  throw new Error('Phone SMS authentication is disabled in Timecapsule Studio.');
}

export async function sendPhoneVerification() {
  throw new Error('Phone SMS authentication is disabled in Timecapsule Studio.');
}

/**
 * Sign Out
 */
export async function signOutUser() {
  if (!auth) return;
  return await signOut(auth);
}

/**
 * Auth State Observer
 */
export function onAuthUserChanged(callback) {
  if (!auth) {
    if (typeof callback === 'function') {
      try {
        callback(null);
      } catch (_) {}
    }
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
