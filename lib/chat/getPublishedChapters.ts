'use server';

import { adminDb } from '@/lib/firebase/admin';

export async function getPublishedChapters() {
  if (!adminDb) return [];
  const snapshot = await adminDb.collection('chapters').where('status', 'in', ['published', 'indexed']).get();
  const chapters: any[] = [];
  snapshot.forEach(doc => {
    chapters.push({ id: doc.id, ...doc.data() });
  });
  return chapters;
}
