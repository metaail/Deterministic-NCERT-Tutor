'use server';

import { adminDb } from '@/lib/firebase/admin';
import { serializeFirestoreData } from '@/lib/firebase/serializeFirestore';

export async function getPublishedChapters() {
  if (!adminDb) return [];
  const snapshot = await adminDb.collection('chapters').where('status', 'in', ['published', 'indexed']).get();
  const chapters: any[] = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    const serializedData = serializeFirestoreData(data);
    chapters.push({
      id: doc.id,
      ...serializedData
    });
  });
  return chapters;
}

