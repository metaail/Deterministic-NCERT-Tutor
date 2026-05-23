import { env } from '../lib/utils/env';

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
  return formattedKey.replace(/\\n/g, '\n');
}

const key = env.FIREBASE_PRIVATE_KEY;
console.log("Raw Length:", key?.length);
console.log("Starts with '?' or double quotes:", key?.startsWith('"'));

const formatted = formatFirebasePrivateKey(key);
console.log("Formatted Length:", formatted?.length);
console.log("Starts with: ", formatted?.substring(0, 30));
console.log("Ends with: ", formatted?.substring(formatted?.length - 30));
console.log("Number of newlines: ", (formatted?.match(/\n/g) || []).length);
