import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { env } from '@/lib/utils/env';

/**
 * Initializes the Firebase Client SDK for frontend authentication flows.
 * This is strictly separated from the Admin SDK to ensure secure boundaries.
 */
const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

// Initialize only if we have minimum config, otherwise return dummy or throw
const app = (env.NEXT_PUBLIC_FIREBASE_API_KEY && !getApps().length) ? initializeApp(firebaseConfig) : (getApps().length ? getApp() : null);
const db = app ? getFirestore(app) : null;
const auth = app ? getAuth(app) : null;

export { app, db, auth };
