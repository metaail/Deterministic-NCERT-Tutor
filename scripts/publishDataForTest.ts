import { adminDb } from '../lib/firebase/admin';

async function main() {
  if (!adminDb) process.exit(1);

  console.log("Publishing all chunks for search testing...");
  
  const snapshot = await adminDb.collection('chapterChunks').get();
  let updated = 0;
  for (const doc of snapshot.docs) {
       await doc.ref.update({ status: 'published' });
       updated++;
  }
  console.log(`Updated ${updated} Firestore chunks to 'published'`);

  // We should also run resync since pinecone needs to know!
  console.log("Please run Phase 7F resync to put vectors into published state.");
}

main().catch(console.error);
