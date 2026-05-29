import { adminDb } from './lib/firebase/admin.js';
import dotenv from 'dotenv';
dotenv.config();
async function list() {
  const snapshot = await adminDb.collection('chapters').get();
  console.log("Chapters:", snapshot.docs.map(d => ({id: d.id, status: d.data().status})));
}
list();
