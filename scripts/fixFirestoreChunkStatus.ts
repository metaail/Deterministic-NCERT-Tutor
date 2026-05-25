import { adminDb } from '../lib/firebase/admin';

async function main() {
  if (!adminDb) process.exit(1);
  const snapshot = await adminDb.collection('chapterChunks').get();
  let updated = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.status !== 'published' && data.status !== 'draft') {
       await doc.ref.update({ status: 'draft' });
       updated++;
    }
  }
  console.log(`Updated ${updated} Firestore chunks to 'draft'`);
}

main().catch(console.error);
