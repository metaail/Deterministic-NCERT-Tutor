import * as admin from 'firebase-admin';
import { env } from '@/lib/utils/env';

/**
 * Initializes the Firebase Admin SDK using a singleton pattern.
 * This guarantees a single connection pool is utilized across all Server Actions
 * and API routes, maintaining high throughput for the Next.js App Router.
 */
function formatFirebasePrivateKey(key: string): string {
  // Correctly formats the private key for Node.js environments
  if (!key) return '';
  let formattedKey = key;
  if (formattedKey.startsWith('"') && formattedKey.endsWith('"')) {
    formattedKey = formattedKey.substring(1, formattedKey.length - 1);
  }
  if (formattedKey.startsWith("'") && formattedKey.endsWith("'")) {
    formattedKey = formattedKey.substring(1, formattedKey.length - 1);
  }
  formattedKey = formattedKey.replace(/\\n/g, '\n');
  
  // If the key doesn't have standard PEM headers, it might be an invalid key or a placeholder.
  // We can try to repair it if someone just pasted the base64 content without headers,
  // but usually it means it's just completely invalid.
  if (!formattedKey.includes('-----BEGIN PRIVATE KEY-----')) {
     console.warn("[Firebase] Warning: FIREBASE_PRIVATE_KEY is missing '-----BEGIN PRIVATE KEY-----' header. It might be invalid or improperly formatted.");
  }
  
  return formattedKey;
}

if (env.FIREBASE_PRIVATE_KEY && !admin.apps.length) {
  const privateKey = formatFirebasePrivateKey(env.FIREBASE_PRIVATE_KEY);
  
  if (privateKey && privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });
    } catch (error: any) {
      console.error("[Firebase] Failed to initialize admin app. Bad private key?", error.message || error);
    }
  } else {
    console.error("[Firebase] Missing or improperly formatted FIREBASE_PRIVATE_KEY (must contain PEM header). Skipping Firebase Admin initialization.");
  }
}

// In preview environment without env vars, these might be undefined if not careful
const adminDb = admin.apps.length ? admin.firestore() : null;
if (adminDb) {
  try {
    adminDb.settings({ ignoreUndefinedProperties: true });
  } catch (e) {
    // Ignore error if already initialized during HMR
  }
}
const adminAuth = admin.apps.length ? admin.auth() : null;

export { adminDb, adminAuth };
