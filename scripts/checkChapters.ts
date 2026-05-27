import { adminDb } from '@/lib/firebase/admin';

async function check() {
  if (!adminDb) return;
  const snapshot = await adminDb.collection('chapters').get();
  for (const doc of snapshot.docs) {
    const data = doc.data();
    console.log(doc.id, data.chapterTitle);
  }
}
check().then(() => {
  process.exit(0);
});
