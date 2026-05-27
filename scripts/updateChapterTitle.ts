import { adminDb } from '@/lib/firebase/admin';

async function updateTitles() {
  if (!adminDb) return;
  const snapshot = await adminDb.collection('chapters').get();
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.subject === 'Mathematics' && data.classLevel === 'Class 11') {
      await doc.ref.update({ chapterTitle: 'relationsAndFunctions' });
      console.log(`Updated ${doc.id}`);
    }
  }
}
updateTitles().then(() => {
  console.log('done');
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
