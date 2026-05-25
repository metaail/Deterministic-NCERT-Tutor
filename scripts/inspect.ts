import { adminDb } from '../lib/firebase/admin';

async function inspect() {
  if (!adminDb) return;
  const sessions = await adminDb.collection('tutorSessions').limit(2).get();
  sessions.forEach(doc => {
    console.log("SESSION:", doc.id, JSON.stringify(doc.data(), null, 2));
  });
}

inspect();
