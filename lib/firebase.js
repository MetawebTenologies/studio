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
    'AIzaSyDLsZZ924v7vJ4GadgdvHH3QsTleMJ97F0',
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN) ||
    'timecapsule-studio.firebaseapp.com',
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_PROJECT_ID) ||
    'timecapsule-studio',
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET) ||
    'timecapsule-studio.firebasestorage.app',
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID) ||
    '359872585718',
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_APP_ID) ||
    '1:359872585718:web:ceaf36f11e241ec33d71d7',
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID) ||
    'G-H0QCVCZB4L',
};

// Singleton App Instance
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Firebase Authentication Instance
export const auth = getAuth(app);

// Providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Safe Analytics helper
let analyticsInstance = null;
let analyticsPromise = null;
export async function getFirebaseAnalytics() {
  if (typeof window === 'undefined') return null;
  if (analyticsInstance) return analyticsInstance;
  if (!analyticsPromise) {
    analyticsPromise = isSupported().then((supported) => {
      if (supported && firebaseConfig.measurementId) {
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
  return await signInWithPopup(auth, googleProvider);
}

/**
 * 2. Email / Password Sign In
 */
export async function signInWithEmail(email, password) {
  return await signInWithEmailAndPassword(auth, email, password);
}

/**
 * 2b. Email / Password Sign Up
 */
export async function signUpWithEmail(email, password) {
  return await createUserWithEmailAndPassword(auth, email, password);
}

/**
 * 3. Phone Sign In Recaptcha Setup
 */
export function createPhoneVerifier(containerIdOrElement) {
  return new RecaptchaVerifier(auth, containerIdOrElement, {
    size: 'invisible',
  });
}

/**
 * 3b. Send Phone SMS Verification Code
 */
export async function sendPhoneVerification(phoneNumber, appVerifier) {
  return await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
}

/**
 * Sign Out
 */
export async function signOutUser() {
  return await signOut(auth);
}

/**
 * Auth State Observer
 */
export function onAuthUserChanged(callback) {
  return onAuthStateChanged(auth, callback);
}
