import { adminDb } from './lib/firebase/admin';

async function logChunks() {
  const snap = await adminDb.collection("chapterChunks").where("chapterKey", "==", "ch-maths-1779381135982").get();
  snap.docs.forEach(doc => {
      console.log(`\n\n---CHUNK ${doc.id}---`);
      console.log(doc.data().textPreview);
      console.log(`FULL TEXT: ${doc.data().text}`);
  });
}
logChunks().catch(console.error);
