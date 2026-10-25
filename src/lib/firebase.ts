import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    'AIzaSyB_dvF9Kz0YxOaTIYOUGvZNSygGHBrFZBk',
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    'fahadaliinterior.firebaseapp.com',
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    'fahadaliinterior',
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    'fahadaliinterior.firebasestorage.app',
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    '75903296545',
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    '1:75903296545:web:a3d6920fbb818ddceb6f60',
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ||
    'G-5DEW6LNTZ3',
};

// Singleton initialization for Next.js App Router (Client & Server safe)
export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const firestore: Firestore = getFirestore(app);

// Providers
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Signs in user with Google popup via Firebase Auth.
 */
export async function signInWithGoogleFirebase() {
  return signInWithPopup(auth, googleAuthProvider);
}

/**
 * Signs in user with Email & Password via Firebase Auth.
 */
export async function signInWithEmailFirebase(email: string, pass: string) {
  return signInWithEmailAndPassword(auth, email, pass);
}

/**
 * Creates user with Email & Password via Firebase Auth.
 */
export async function registerWithEmailFirebase(email: string, pass: string) {
  return createUserWithEmailAndPassword(auth, email, pass);
}

/**
 * Sets up Firebase invisible Recaptcha for Phone Authentication on a DOM element ID.
 */
export function initPhoneRecaptcha(containerId: string = 'firebase-recaptcha-container'): RecaptchaVerifier | null {
  if (typeof window === 'undefined') return null;
  const container = document.getElementById(containerId);
  if (!container) return null;

  try {
    return new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
      'expired-callback': () => {
        // Response expired. Ask user to solve reCAPTCHA again.
      },
    });
  } catch {
    return null;
  }
}

/**
 * Dispatches 6-digit SMS OTP to a phone number (+923xxxxxxxxx) using Google Firebase SMS infrastructure.
 */
export async function sendFirebasePhoneOtp(
  e164Phone: string,
  appVerifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  return signInWithPhoneNumber(auth, e164Phone, appVerifier);
}
