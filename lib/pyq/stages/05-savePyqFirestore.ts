import { PyqIngestionContext } from '../types';
import { adminDb } from '@/lib/firebase/admin';

export async function savePyqFirestore(ctx: PyqIngestionContext): Promise<PyqIngestionContext> {
  if (!adminDb) {
    console.warn("Firestore not available! Skipping DB save.");
    return ctx;
  }

  const batch = adminDb.batch();

  // Save Paper Metadata
  const paperRef = adminDb.collection('pyqPapers').doc(ctx.paperId);
  batch.set(paperRef, {
    ...ctx.metadata,
    status: 'indexed',
    updatedAt: new Date().toISOString()
  }, { merge: true });

  // Save Questions
  for (const record of ctx.pyqRecords) {
    const qRef = adminDb.collection('pyqQuestions').doc(record.questionId);
    batch.set(qRef, record);
  }

  await batch.commit();
  console.log(`Successfully saved ${ctx.pyqRecords.length} PYQ records to Firestore`);

  return ctx;
}
